import { ref, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore, useMenuStore } from '@/store'
import { Modal } from '@arco-design/web-vue'
import { MENU_TYPE } from '@/constants'
import { resetDynamicRoutes } from '@/router'
import type { SysMenu } from '@/types/system'

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

  // 用户手动展开的 key 集合
  const userExpandedKeys = ref<Set<string>>(new Set())
  // 用户手动折叠的 key 集合（覆盖 autoExpandedKey 的自动展开）
  const userCollapsedKeys = ref<Set<string>>(new Set())

  const menuItems = computed<MenuItem[]>(() => {
    return buildMenuItems(menuStore.menuTree)
  })

  // 包含当前路由的父菜单 key（用于自动展开）
  const autoExpandedKey = computed<string | undefined>(() => {
    const current = route.path
    const group = menuItems.value.find((item) =>
      item.children?.some((child) => child.key === current),
    )
    return group?.key
  })

  // 实际展开集合 = 用户展开 ∪ 自动展开（除非被用户标记为折叠）
  const effectiveExpandedKeys = computed<Set<string>>(() => {
    const set = new Set(userExpandedKeys.value)
    if (autoExpandedKey.value && !userCollapsedKeys.value.has(autoExpandedKey.value)) {
      set.add(autoExpandedKey.value)
    }
    return set
  })

  // 路由切换到新组时，清除该组的"用户已折叠"标记 — 用户再次进入子路由时仍能看到父菜单
  watch(autoExpandedKey, (newKey, oldKey) => {
    if (newKey && newKey !== oldKey && userCollapsedKeys.value.has(newKey)) {
      const next = new Set(userCollapsedKeys.value)
      next.delete(newKey)
      userCollapsedKeys.value = next
    }
  })

  function isGroupExpanded(key: string): boolean {
    return effectiveExpandedKeys.value.has(key)
  }

  function toggleGroup(key: string) {
    if (effectiveExpandedKeys.value.has(key)) {
      // 当前展开 → 折叠
      const expanded = new Set(userExpandedKeys.value)
      expanded.delete(key)
      userExpandedKeys.value = expanded
      // 如果是自动展开的组，把折叠意图记下来（否则 watch 会立即把它重新展开）
      if (key === autoExpandedKey.value) {
        const collapsed = new Set(userCollapsedKeys.value)
        collapsed.add(key)
        userCollapsedKeys.value = collapsed
      }
    } else {
      // 当前折叠 → 展开
      const expanded = new Set(userExpandedKeys.value)
      expanded.add(key)
      userExpandedKeys.value = expanded
      // 展开时清除任何残留的折叠意图
      if (userCollapsedKeys.value.has(key)) {
        const collapsed = new Set(userCollapsedKeys.value)
        collapsed.delete(key)
        userCollapsedKeys.value = collapsed
      }
    }
  }

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
    isGroupExpanded,
    toggleGroup,
    selectedKey,
    userNickname,
    handleMenuClick,
    handleLogout,
    toggleCollapse,
  }
}
