<script setup lang="ts">
import { useLayout } from '@/hooks/useLayout'
import { resolveIcon } from '@/utils/icon'
import { Message } from '@arco-design/web-vue'

const {
  collapsed,
  menuItems,
  selectedKey,
  userNickname,
  handleMenuClick,
  handleLogout,
  toggleCollapse,
} = useLayout()

function handleChangePassword() {
  // TODO: 修改密码功能待实现
  Message.info('修改密码功能待实现')
}
</script>

<template>
  <div class="layout">
    <!-- 侧边栏 -->
    <aside class="sidebar" :class="{ collapsed }">
      <div class="sidebar-header">
        <div class="logo" @click="toggleCollapse">
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
          <span class="page-title">{{ $route.meta?.title || '首页' }}</span>
        </div>
        <div class="header-right">
          <a-dropdown trigger="click">
            <div class="user-dropdown">
              <span class="user-avatar">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              </span>
              <span class="user-name">{{ userNickname }}</span>
              <span class="dropdown-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </span>
            </div>
            <template #content>
              <a-doption @click="handleChangePassword">
                <span class="doption-icon"><icon-lock /></span>
                修改密码
              </a-doption>
              <a-doption @click="handleLogout">
                <span class="doption-icon"><icon-export /></span>
                退出登录
              </a-doption>
            </template>
          </a-dropdown>
        </div>
      </header>

      <main class="content">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" :key="$route.path" />
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

  &.collapsed { width: 64px; }
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

  svg { width: 100%; height: 100%; }
}

.logo-text {
  font-size: 16px;
  font-weight: 600;
  color: #1a1a1a;
  letter-spacing: 2px;
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

  &:hover { background: #f5f5f5; color: #1a1a1a; }
  &.active { background: #f5f5f5; color: #1a1a1a; font-weight: 500; }
  &.sub { padding-left: 44px; }
}

.nav-icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;

  svg, :deep(svg) { width: 100%; height: 100%; }
  :deep(img) { width: 18px; height: 18px; }
}

.nav-text {
  font-size: 13px;
  white-space: nowrap;
}

.nav-group { margin-bottom: 4px; }

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

  &:hover { background: #f5f5f5; }
}

.user-avatar {
  width: 28px;
  height: 28px;
  color: #999;

  svg { width: 100%; height: 100%; }
}

.user-name {
  font-size: 13px;
  color: #333;
}

.dropdown-icon {
  width: 14px;
  height: 14px;
  color: #999;
  margin-left: 2px;

  svg { width: 100%; height: 100%; }
}

.doption-icon {
  display: inline-flex;
  vertical-align: middle;
  margin-right: 8px;
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
  font-size: 13px;
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