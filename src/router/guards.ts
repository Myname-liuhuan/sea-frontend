import type { RouteRecordRaw } from 'vue-router'
import type { SysMenu } from '@/types'
import { MENU_TYPE } from '@/constants'

/**
 * 动态路由表（按需注入；通过 menuTree 派生）
 * 命名规则：`dyn_${menu.id}`，便于 logout 时清理
 */

interface DynamicRouteNames {
  names: Set<string>
}

/**
 * 将菜单树转换为 Vue Router 路由配置。
 * - DIRECTORY 类型：作为 Layout 包裹路由，递归处理 children
 * - MENU 类型 + 有 component：作为叶子路由（懒加载）
 * - BUTTON 类型：无路由（仅用于 v-has-permi 控制按钮）
 */
export function buildDynamicRoutes(menuTree: SysMenu[]): { routes: RouteRecordRaw[]; names: DynamicRouteNames } {
  const dynNames: DynamicRouteNames = { names: new Set<string>() }

  const routes = menuTree
    .filter((menu) => menu.menuType !== MENU_TYPE.BUTTON)
    .map((menu) => convertMenu(menu, dynNames))
    .filter((route): route is RouteRecordRaw => route !== null)

  return { routes, names: dynNames }
}

function convertMenu(menu: SysMenu, dynNames: DynamicRouteNames): RouteRecordRaw | null {
  if (menu.menuType === MENU_TYPE.MENU) {
    // MENU 类型必须有 component 才能成为可访问路由
    if (!menu.component) return null
    const name = `dyn_${menu.id}`
    dynNames.names.add(name)
    return {
      path: stripLeadingSlash(menu.path),
      name,
      component: () => import(`@/views/${menu.component}.vue`),
      meta: { title: menu.menuName, perms: menu.perms },
    }
  }

  if (menu.menuType === MENU_TYPE.DIRECTORY) {
    // DIRECTORY 作为父路由，递归 children
    const children = (menu.children ?? [])
      .filter((child) => child.menuType !== MENU_TYPE.BUTTON)
      .map((child) => convertMenu(child, dynNames))
      .filter((route): route is RouteRecordRaw => route !== null)

    if (children.length === 0) return null

    // 目录路由必须挂载在 Layout 下，且至少有一个子菜单
    const name = `dyn_${menu.id}`
    dynNames.names.add(name)
    return {
      path: stripLeadingSlash(menu.path),
      name,
      redirect: children[0]?.path ? `/${stripLeadingSlash(menu.path)}/${stripLeadingSlash(children[0].path as string)}` : undefined,
      component: () => import('@/layouts/DefaultLayout.vue'),
      children,
    }
  }

  return null
}

function stripLeadingSlash(path: string): string {
  return path.startsWith('/') ? path.slice(1) : path
}