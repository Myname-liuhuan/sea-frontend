<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

function goHome() {
  router.replace('/')
}
</script>

<template>
  <div class="error-page">
    <div class="error-code">404</div>
    <div class="error-message">页面不存在</div>
    <button class="back-btn" @click="goHome">返回首页</button>
  </div>
</template>

<style scoped lang="scss">
.error-page {
  min-height: 60vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
}

.error-code {
  font-size: 96px;
  font-weight: 700;
  color: var(--color-primary);
  line-height: 1;
}

.error-message {
  font-size: 16px;
  color: var(--text-secondary);
}

.back-btn {
  height: 36px;
  padding: 0 20px;
  font-size: 13px;
  background: var(--color-primary);
  color: var(--bg-secondary);
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;

  &:hover { background: var(--color-primary-light); }
}
</style>