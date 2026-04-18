<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores'

const router = useRouter()
const userStore = useUserStore()
const collapsed = ref(false)

function handleLogout() {
  userStore.clearToken()
  router.push('/login')
}
</script>

<template>
  <a-layout class="app-layout">
    <a-layout-sider
      :collapsed="collapsed"
      collapsible
      :width="220"
      breakpoint="lg"
      @collapse="(val: boolean) => (collapsed = val)"
    >
      <div class="logo">
        <span v-if="!collapsed">Sea Admin</span>
        <span v-else>S</span>
      </div>
      <a-menu
        :default-selected-keys="['Home']"
        :style="{ width: '100%' }"
        @menu-item-click="(key: string) => router.push({ name: key })"
      >
        <a-menu-item key="Home">
          <template #icon><icon-home /></template>
          首页
        </a-menu-item>
        <a-menu-item key="About">
          <template #icon><icon-info-circle /></template>
          关于
        </a-menu-item>
      </a-menu>
    </a-layout-sider>

    <a-layout>
      <a-layout-header class="app-header">
        <a-space>
          <a-typography-text style="color: var(--color-text-1)">
            Sea Frontend
          </a-typography-text>
        </a-space>
        <a-space>
          <a-button type="text" @click="handleLogout">退出登录</a-button>
        </a-space>
      </a-layout-header>

      <a-layout-content class="app-content">
        <router-view />
      </a-layout-content>

      <a-layout-footer class="app-footer">
        Sea Frontend &copy; {{ new Date().getFullYear() }}
      </a-layout-footer>
    </a-layout>
  </a-layout>
</template>

<style scoped lang="scss">
.app-layout {
  min-height: 100vh;
}

.logo {
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 700;
  color: var(--color-text-1);
  border-bottom: 1px solid var(--color-border);
}

.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  background: var(--color-bg-2);
  border-bottom: 1px solid var(--color-border);
}

.app-content {
  margin: 16px 24px;
  padding: 24px;
  background: var(--color-bg-2);
  border-radius: 4px;
  min-height: calc(100vh - 180px);
}

.app-footer {
  text-align: center;
  color: var(--color-text-3);
  font-size: 13px;
}
</style>
