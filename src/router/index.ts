import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import Layout from '@/layouts/DefaultLayout.vue'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: Layout,
    redirect: '/home',
    children: [
      {
        path: 'home',
        name: 'Home',
        component: () => import('@/pages/home/index.vue'),
        meta: { title: '首页' },
      },
      {
        path: 'about',
        name: 'About',
        component: () => import('@/pages/about/index.vue'),
        meta: { title: '关于' },
      },
      {
        path: 'user',
        name: 'User',
        component: () => import('@/pages/user/index.vue'),
        meta: { title: '用户管理' },
      },
      {
        path: 'role',
        name: 'Role',
        component: () => import('@/pages/role/index.vue'),
        meta: { title: '角色管理' },
      },
      {
        path: 'menu',
        name: 'Menu',
        component: () => import('@/pages/menu/index.vue'),
        meta: { title: '菜单管理' },
      },
    ],
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/pages/login/index.vue'),
    meta: { title: '登录' },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to, _from, next) => {
  const token = localStorage.getItem('token')
  if (to.name !== 'Login' && !token) {
    next({ name: 'Login' })
  } else {
    document.title = `${to.meta.title || ''} - Sea`
    next()
  }
})

export default router
