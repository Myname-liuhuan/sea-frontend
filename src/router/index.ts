import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { Message } from '@arco-design/web-vue'
import { useUserStore } from '@/store/user'
import { useMenuStore } from '@/store/menu'
import { getMyMenuTree } from '@/api/menu'
import { RESPONSE_CODE } from '@/constants'
import { buildDynamicRoutes } from './guards'
import workflowRoutes from './workflow'

/** 静态基础路由（不需要权限也始终可用） */
const staticRoutes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/index.vue'),
    meta: { title: '登录' },
  },
  {
    path: '/404',
    name: 'NotFound',
    component: () => import('@/views/error/404.vue'),
    meta: { title: '页面不存在' },
  },
  {
    path: '/',
    component: () => import('@/layouts/DefaultLayout.vue'),
    redirect: '/home',
    children: [
      {
        path: 'home',
        name: 'Home',
        component: () => import('@/views/home/index.vue'),
        meta: { title: '首页' },
      },
      {
        path: 'about',
        name: 'About',
        component: () => import('@/views/about/index.vue'),
        meta: { title: '关于' },
      },
      {
        // 工作流详情（无菜单项的临时页，路由裸挂于 Layout 下）
        path: 'workflow/detail',
        name: 'WorkflowDetail',
        component: () => import('@/views/workflow/Detail.vue'),
        meta: { title: '工单详情' },
      },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes: staticRoutes,
})

/** 注入动态路由（在 beforeEach 中调用） */
async function injectDynamicRoutes(): Promise<boolean> {
  if (dynamicInjected) return true

  const menuStore = useMenuStore()
  // menuTree 为空时拉取
  if (menuStore.menuTree.length === 0) {
    const res = await getMyMenuTree()
    if (res.code !== RESPONSE_CODE.SUCCESS) {
      Message.error(res.message || '获取菜单失败')
      return false
    }
    menuStore.setMenuTree(res.data)
  }

  const { routes, names } = buildDynamicRoutes(menuStore.menuTree)
  for (const route of routes) {
    router.addRoute(route)
  }
  names.names.forEach((n) => dynamicRouteNames.add(n))
  dynamicInjected = true
  return true
}

/** 重置动态路由（logout 时调用） */
export function resetDynamicRoutes() {
  dynamicRouteNames.forEach((name) => router.removeRoute(name))
  dynamicRouteNames.clear()
  dynamicInjected = false
}

router.beforeEach(async (to, _from, next) => {
  const userStore = useUserStore()
  const token = userStore.token

  document.title = `${to.meta.title || ''} - Sea`

  // 登录页 / 404：直接放行
  if (to.name === 'Login' || to.name === 'NotFound') {
    // 已登录访问登录页 → 跳首页
    if (to.name === 'Login' && token) {
      next({ path: '/' })
      return
    }
    next()
    return
  }

  // 其他路由：必须有 token
  if (!token) {
    next({ name: 'Login' })
    return
  }

  // 注入动态路由
  const injected = await injectDynamicRoutes()
  if (!injected) {
    next({ name: 'Login' })
    return
  }

  // 检查目标路由是否已注册
  if (to.name && router.hasRoute(to.name)) {
    next()
    return
  }

  // 路径存在于 router 但 name 匹配不到 / 路由未注入：跳 404
  next({ name: 'NotFound' })
})

export default router