import type { RouteRecordRaw } from 'vue-router'
import type { SysMenu } from '@/types/system'
import { MENU_TYPE } from '@/constants'
import DefaultLayout from '@/layouts/DefaultLayout.vue'

/**
 * 预建所有 views 文件的懒加载映射。
 * 原因：vite 的 `import()` 模板字符串只支持单级变量，菜单 component 形如
 * `system/user/index` 多级路径会报 "Unknown variable dynamic import" 错误。
 * 用 import.meta.glob 一次性收集所有 .vue，运行时按路径取即可。
 */
const viewModules = import.meta.glob('@/views/**/*.vue')

/**
 * 加载菜单对应的视图组件。
 *
 * <p>约定：**literal path**——component 即 vue 文件相对 `src/views/` 的路径、
 * 不含 `.vue` 后缀。例如：
 * <ul>
 *   <li>{@code user/index} → {@code src/views/user/index.vue}</li>
 *   <li>{@code workflow/MyApplications} → {@code src/views/workflow/MyApplications.vue}</li>
 * </ul>
 *
 * <p>如果某条菜单 component 拼错 / 对应页面尚未实现（旧菜单留下或新模块刚接入），
 * **返回 null 而非抛错**，由调用方跳过该菜单——避免单条坏数据让整个 dynamic route
 * 注入失败、登录后白屏。
 */
function loadView(component: string): unknown {
  const module = viewModules[`/src/views/${component}.vue`]
  if (!module) {
    // eslint-disable-next-line no-console
    console.warn(
      `[sea] 菜单 component="${component}" 找不到视图 @/views/${component}.vue，已跳过该菜单`,
    )
    return null
  }
  return module
}

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
    .map((menu) => convertMenu(menu, dynNames, false))
    .filter((route): route is RouteRecordRaw => route !== null)

  return { routes, names: dynNames }
}

function convertMenu(
  menu: SysMenu,
  dynNames: DynamicRouteNames,
  asChild: boolean,
): RouteRecordRaw | null {
  if (menu.menuType === MENU_TYPE.MENU) {
    // MENU 类型必须有 component 才能成为可访问路由
    if (!menu.component) return null
    const componentLoader = loadView(menu.component)
    if (componentLoader == null) return null
    const name = `dyn_${menu.id}`
    dynNames.names.add(name)
    return {
      // 顶级路由用绝对路径；子路由用相对路径（取最后一段）
      path: asChild ? lastPathSegment(menu.path) : ensureLeadingSlash(menu.path),
      name,
      component: componentLoader,
      meta: { title: menu.menuName, perms: menu.perms },
    }
  }

  if (menu.menuType === MENU_TYPE.DIRECTORY) {
    // DIRECTORY 作为父路由，递归 children
    const children = (menu.children ?? [])
      .filter((child) => child.menuType !== MENU_TYPE.BUTTON)
      .map((child) => convertMenu(child, dynNames, true))
      .filter((route): route is RouteRecordRaw => route !== null)

    if (children.length === 0) return null

    // 目录路由必须挂载在 Layout 下，且至少有一个子菜单
    const name = `dyn_${menu.id}`
    dynNames.names.add(name)
    const ownPath = asChild ? lastPathSegment(menu.path) : ensureLeadingSlash(menu.path)
    const firstChildPath = children[0]?.path
    return {
      path: ownPath,
      name,
      // 重定向：顶级时拼绝对路径；子级时直接用首个 child 的相对路径
      redirect: firstChildPath
        ? (asChild ? firstChildPath : `${ownPath}/${firstChildPath}`)
        : undefined,
      component: DefaultLayout,
      children,
    }
  }

  return null
}

/** 顶级路由要求 path 以 / 开头：缺失时补上 */
function ensureLeadingSlash(path: string): string {
  return path.startsWith('/') ? path : `/${path}`
}

/** 子路由要求 path 为相对路径：取 path 的最后一段（去掉前导斜杠的多段绝对路径） */
function lastPathSegment(path: string): string {
  const segments = path.split('/').filter(Boolean)
  return segments[segments.length - 1] ?? path
}