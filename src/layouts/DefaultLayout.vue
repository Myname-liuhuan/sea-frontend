<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { useLayout } from '@/hooks/useLayout'
import { useNotificationBell } from '@/hooks/useNotificationBell'
import { useUserStore } from '@/store'
import { resolveIcon } from '@/utils/icon'
import { Message, Trigger as ATrigger } from '@arco-design/web-vue'

const userStore = useUserStore()

const {
  collapsed,
  menuItems,
  selectedKey,
  userNickname,
  handleMenuClick,
  handleLogout,
  toggleCollapse,
} = useLayout()

const {
  unread,
  unreadLabel,
  inboxOpen,
  recent,
  inboxLoading,
  openInbox,
  onRead,
  onReadAll,
} = useNotificationBell()

/** WebSocket 站内信推送订阅（real-time 增量更新 unread） */
const WS_RECONNECT_DELAY_MS = 5_000
let socket: WebSocket | null = null
function connectWs() {
  if (socket) return
  const protocol = location.protocol === 'https:' ? 'wss' : 'ws'
  const baseUrl = (import.meta.env.VITE_WS_BASE_URL as string) || `${protocol}://${location.host}`
  const token = userStore.token
  if (!token) return
  // 用 token 而不是 userId：服务端从 JWT 解析 userId，伪造 query 没意义
  const ws = new WebSocket(`${baseUrl}/ws/notify?token=${encodeURIComponent(token)}`)
  ws.onmessage = () => {
    // 收到任意推送即递增未读
    unread.value = unread.value + 1
  }
  ws.onclose = () => {
    socket = null
    setTimeout(connectWs, WS_RECONNECT_DELAY_MS)
  }
  ws.onerror = () => {
    try {
      ws.close()
    } catch {
      // swallow
    }
  }
  socket = ws
}

onMounted(() => {
  connectWs()
})

onUnmounted(() => {
  if (socket) {
    socket.close()
    socket = null
  }
})

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
          <!-- 站内信铃铛 -->
          <ATrigger
            trigger="click"
            :popup-visible="inboxOpen"
            position="bottom"
            :unmount-on-close="true"
            @popup-visible-change="(v: boolean) => (inboxOpen = v)"
          >
            <button class="bell-btn" @click="openInbox">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/>
                <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
              </svg>
              <span v-if="unread > 0" class="bell-badge">{{ unreadLabel }}</span>
            </button>
            <template #content>
              <div class="inbox-panel" @click.stop>
                <div class="inbox-header">
                  <span>站内信</span>
                  <a-link v-if="unread > 0" @click="onReadAll">全部已读</a-link>
                </div>
                <div v-if="inboxLoading" class="inbox-empty">加载中…</div>
                <div v-else-if="recent.length === 0" class="inbox-empty">暂无消息</div>
                <ul v-else class="inbox-list">
                  <li
                    v-for="msg in recent"
                    :key="msg.id"
                    :class="['inbox-item', { unread: msg.readFlag === 0 }]"
                  >
                    <div class="inbox-title">{{ msg.title }}</div>
                    <div class="inbox-content">{{ msg.content }}</div>
                    <div class="inbox-meta">
                      <span>{{ msg.createdAt }}</span>
                      <a-link v-if="msg.readFlag === 0" @click="onRead(msg.id)">标已读</a-link>
                      <router-link v-if="msg.link" :to="msg.link">查看</router-link>
                    </div>
                  </li>
                </ul>
              </div>
            </template>
          </ATrigger>

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

.bell-btn {
  position: relative;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  border-radius: 6px;
  color: #666;
  cursor: pointer;
  margin-right: var(--space-md);

  &:hover { background: #f5f5f5; color: #1a1a1a; }
  svg { width: 18px; height: 18px; }
}

.bell-badge {
  position: absolute;
  top: 4px;
  right: 4px;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  line-height: 1;
  color: #fff;
  background: #f53f3f;
  border-radius: 8px;
}

.inbox-panel {
  width: 360px;
  max-height: 480px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.inbox-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
  font-weight: 500;
}

.inbox-empty {
  padding: 32px;
  text-align: center;
  color: #999;
  font-size: 13px;
}

.inbox-list {
  list-style: none;
  margin: 0;
  padding: 0;
  overflow-y: auto;
  flex: 1;
}

.inbox-item {
  padding: 12px 16px;
  border-bottom: 1px solid #f5f5f5;
  cursor: pointer;
  transition: background 0.15s ease;
  &:hover { background: #fafafa; }
  &.unread .inbox-title { font-weight: 600; }
}

.inbox-title {
  font-size: 13px;
  margin-bottom: 4px;
}

.inbox-content {
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.inbox-meta {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: #999;
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