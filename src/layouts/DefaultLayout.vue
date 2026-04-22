<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore, useMenuStore } from '@/stores'
import { getMyMenuTree } from '@/api/menu'
import { Modal } from '@arco-design/web-vue'
import type { SysMenu } from '@/types'
import { resolveIcon } from '@/utils/icon'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const menuStore = useMenuStore()

const collapsed = ref(false)

const menuItems = computed(() => {
  return buildMenuItems(menuStore.menuTree)
})

function buildMenuItems(menus: SysMenu[]) {
  return menus
    .filter((m) => String(m.menuType) !== '3')
    .map((menu) => {
      const key = menu.path?.startsWith('/') ? menu.path : `/${menu.path}`
      return {
        key,
        title: menu.menuName,
        icon: menu.icon,
        children: menu.children ? buildMenuItems(menu.children) : undefined,
      }
    })
}

const selectedKey = computed(() => route.path)

async function loadMenus() {
  if (!menuStore.menuTree.length) {
    try {
      const res = await getMyMenuTree()
      if (res.code === 200) {
        menuStore.setMenuTree(res.data)
      }
    } catch (_error) {
      // ignore
    }
  }
}

function handleMenuClick(key: string) {
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
      router.push('/login')
    },
  })
}

const userNickname = computed(() => {
  const info = userStore.userInfo as { nickname?: string; username?: string }
  return info?.nickname || info?.username || '用户'
})

onMounted(() => {
  loadMenus()
})
</script>

<template>
  <div class="layout">
    <!-- 侧边栏 -->
    <aside class="sidebar" :class="{ collapsed }">
      <div class="sidebar-header">
        <div class="logo" @click="collapsed = !collapsed">
          <div class="logo-icon">
            <svg viewBox="0 0 32 32" fill="none">
              <path d="M16 4L28 10V22L16 28L4 22V10L16 4Z" stroke="currentColor" stroke-width="2"/>
              <path d="M16 10L22 13V19L16 22L10 19V13L16 10Z" fill="currentColor"/>
            </svg>
          </div>
          <span v-if="!collapsed" class="logo-text">Sea Admin</span>
        </div>
      </div>

      <nav class="sidebar-nav">
        <div class="nav-item" :class="{ active: selectedKey === '/home' }" @click="handleMenuClick('/home')">
          <span class="nav-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          </span>
          <span v-if="!collapsed" class="nav-text">首页</span>
        </div>

        <template v-for="menu in menuItems" :key="menu.key">
          <div
            v-if="!menu.children"
            class="nav-item"
            :class="{ active: selectedKey === menu.key }"
            @click="handleMenuClick(menu.key)"
          >
            <span class="nav-icon">
              <component :is="resolveIcon(menu.icon)" v-if="resolveIcon(menu.icon)" />
              <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="3"/>
                <path d="M12 2v4m0 12v4M2 12h4m12 0h4"/>
              </svg>
            </span>
            <span v-if="!collapsed" class="nav-text">{{ menu.title }}</span>
          </div>

          <div v-else class="nav-group" :class="{ collapsed }">
            <div class="nav-group-title" v-if="!collapsed">
              <span class="nav-icon">
                <component :is="resolveIcon(menu.icon)" v-if="resolveIcon(menu.icon)" />
                <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="3"/>
                  <path d="M12 2v4m0 12v4M2 12h4m12 0h4"/>
                </svg>
              </span>
              <span class="nav-text">{{ menu.title }}</span>
            </div>
            <div
              v-for="child in menu.children"
              :key="child.key"
              class="nav-item sub"
              :class="{ active: selectedKey === child.key }"
              @click="handleMenuClick(child.key)"
            >
              <span class="nav-icon">
                <component :is="resolveIcon(child.icon)" v-if="resolveIcon(child.icon)" />
                <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              </span>
              <span v-if="!collapsed" class="nav-text">{{ child.title }}</span>
            </div>
          </div>
        </template>
      </nav>
    </aside>

    <!-- 主内容区 -->
    <div class="main">
      <header class="header">
        <div class="header-left">
          <span class="page-title">{{ route.meta?.title || '首页' }}</span>
        </div>
        <div class="header-right">
          <div class="user-dropdown" @click="handleLogout">
            <span class="user-avatar">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </span>
            <span class="user-name">{{ userNickname }}</span>
            <span class="logout-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </span>
          </div>
        </div>
      </header>

      <main class="content">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" :key="route.path" />
          </transition>
        </router-view>
      </main>

      <footer class="footer">
        <span>Sea Admin &copy; {{ new Date().getFullYear() }}</span>
      </footer>
    </div>
  </div>
</template>

<style scoped lang="scss">
.layout {
  display: flex;
  min-height: 100vh;
  background: #fafafa;
}

.sidebar {
  width: 220px;
  background: #fff;
  border-right: 1px solid #f0f0f0;
  display: flex;
  flex-direction: column;
  transition: width 0.3s ease;
  flex-shrink: 0;

  &.collapsed {
    width: 64px;
  }
}

.sidebar-header {
  height: 56px;
  border-bottom: 1px solid #f0f0f0;
}

.logo {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 0 16px;
  cursor: pointer;
}

.logo-icon {
  width: 28px;
  height: 28px;
  color: #1a1a1a;
  flex-shrink: 0;

  svg {
    width: 100%;
    height: 100%;
  }
}

.logo-text {
  font-size: 16px;
  font-weight: 600;
  color: #1a1a1a;
  letter-spacing: 1px;
  white-space: nowrap;
}

.sidebar-nav {
  flex: 1;
  padding: 12px 8px;
  overflow-y: auto;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #666;
  margin-bottom: 2px;

  &:hover {
    background: #f5f5f5;
    color: #1a1a1a;
  }

  &.active {
    background: #f5f5f5;
    color: #1a1a1a;
    font-weight: 500;
  }

  &.sub {
    padding-left: 44px;
  }
}

.nav-icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;

  svg, :deep(svg) {
    width: 100%;
    height: 100%;
  }

  :deep(img) {
    width: 18px;
    height: 18px;
  }
}

.nav-text {
  font-size: 13px;
  white-space: nowrap;
}

.nav-group {
  margin-bottom: 4px;
}

.nav-group-title {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  font-size: 12px;
  font-weight: 500;
  color: #999;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.header {
  height: 56px;
  background: #fff;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
}

.page-title {
  font-size: 15px;
  font-weight: 500;
  color: #1a1a1a;
}

.header-right {
  display: flex;
  align-items: center;
}

.user-dropdown {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #f5f5f5;
  }
}

.user-avatar {
  width: 28px;
  height: 28px;
  color: #999;

  svg {
    width: 100%;
    height: 2;
  }
}

.user-name {
  font-size: 13px;
  color: #333;
}

.logout-icon {
  width: 16px;
  height: 16px;
  color: #999;
  margin-left: 4px;

  svg {
    width: 100%;
    height: 100%;
  }
}

.content {
  flex: 1;
  padding: 24px;
  min-height: 0;
}

.footer {
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: #bfbfbf;
  border-top: 1px solid #f0f0f0;
  background: #fff;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.fade-enter-from {
  opacity: 0;
  transform: translateY(8px);
}

.fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>