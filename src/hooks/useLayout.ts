import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore, useMenuStore } from '@/store'
import { Modal } from '@arco-design/web-vue'
import { MENU_TYPE } from '@/constants'
import { resetDynamicRoutes } from '@/router'
import type { SysMenu } from '@/types'

interface MenuItem {
  key: string
  title: string
  icon?: string
  children?: MenuItem[]
}

export function useLayout() {
  const router = useRouter()
  const route = useRoute()
  const userStore = useUserStore()
  const menuStore = useMenuStore()

  const collapsed = ref(false)

  const menuItems = computed<MenuItem[]>(() => {
    return buildMenuItems(menuStore.menuTree)
  })

  function filterMenuItems(menus: SysMenu[]): SysMenu[] {
    return menus.filter((m) => String(m.menuType) !== MENU_TYPE.BUTTON)
  }

  function toMenuItem(menu: SysMenu): MenuItem {
    // 目录菜单的 path 可能为空，key 也保持空串，由 click 处拦截
    const key = menu.path?.startsWith('/') ? menu.path : menu.path ? `/${menu.path}` : ''
    return {
      key,
      title: menu.menuName,
      icon: menu.icon,
      children: menu.children ? buildMenuItems(menu.children) : undefined,
    }
  }

  function buildMenuItems(menus: SysMenu[]): MenuItem[] {
    return filterMenuItems(menus).map(toMenuItem)
  }

  const selectedKey = computed(() => route.path)

  function handleMenuClick(key: string) {
    // 目录菜单无 path：拦截空 key
    if (!key) return
    router.push(key)
  }

  function handleLogout() {
    Modal.confirm({
      title: '确认退出',
      content: '确定要退出登录吗？',
      okText: '确定',
      cancelText: '取消',
      onOk() {
        userStore.clearToken()
        menuStore.clearMenuTree()
        resetDynamicRoutes()
        router.push('/login')
      },
    })
  }

  const userNickname = computed(() => {
    const info = userStore.userInfo
    return info?.username || '用户'
  })

  function toggleCollapse() {
    collapsed.value = !collapsed.value
  }

  return {
    collapsed,
    menuItems,
    selectedKey,
    userNickname,
    handleMenuClick,
    handleLogout,
    toggleCollapse,
  }
}
