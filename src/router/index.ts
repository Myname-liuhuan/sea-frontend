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
        component: () => import('@/views/home/index.vue'),
        meta: { title: '首页' },
      },
      {
        path: 'about',
        name: 'About',
        component: () => import('@/views/about/index.vue'),
        meta: { title: '关于' },
      },
    ],
  },
  {
    path: '/system',
    component: Layout,
    redirect: '/system/user',
    children: [
      {
        path: 'user',
        name: 'SystemUser',
        component: () => import('@/views/user/index.vue'),
        meta: { title: '用户管理' },
      },
      {
        path: 'role',
        name: 'SystemRole',
        component: () => import('@/views/role/index.vue'),
        meta: { title: '角色管理' },
      },
      {
        path: 'menu',
        name: 'SystemMenu',
        component: () => import('@/views/menu/index.vue'),
        meta: { title: '菜单管理' },
      },
      {
        path: 'dept',
        name: 'SystemDept',
        component: () => import('@/views/dept/index.vue'),
        meta: { title: '部门管理' },
      },
    ],
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/index.vue'),
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
