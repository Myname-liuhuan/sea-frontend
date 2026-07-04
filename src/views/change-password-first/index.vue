<script setup lang="ts">
import { useChangePasswordFirst } from '@/hooks/useChangePasswordFirst'

const { form, loading, handleSubmit, handleLogout } = useChangePasswordFirst()
</script>

<template>
  <div class="change-password-page">
    <div class="card">
      <h2 class="title">请先修改密码</h2>
      <p class="hint">系统检测到您的密码是临时密码（来自重置密码工单）。为安全起见，请设置一个至少 8 位的新密码。</p>
      <form class="form" @submit.prevent="handleSubmit">
        <div class="form-item">
          <label>新密码</label>
          <input
            v-model="form.newPassword"
            type="password"
            minlength="8"
            placeholder="至少 8 位"
            class="form-input"
            autocomplete="new-password"
          />
        </div>
        <div class="form-item">
          <label>确认新密码</label>
          <input
            v-model="form.confirmPassword"
            type="password"
            minlength="8"
            placeholder="再次输入"
            class="form-input"
            autocomplete="new-password"
          />
        </div>
        <div class="form-actions">
          <button class="btn btn-primary" :disabled="loading" type="submit">
            {{ loading ? '提交中...' : '提交并重新登录' }}
          </button>
          <button class="btn btn-default" type="button" @click="handleLogout">
            取消并退出
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
.change-password-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-secondary, #fafafa);
  padding: var(--space-md, 24px);
}
.card {
  width: 100%;
  max-width: 480px;
  background: #fff;
  border-radius: var(--radius-lg, 12px);
  padding: var(--space-lg, 32px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06);
}
.title {
  font-size: 22px;
  margin: 0 0 var(--space-sm, 8px);
}
.hint {
  font-size: 13px;
  color: var(--color-text-2, #666);
  margin-bottom: var(--space-md, 24px);
  line-height: 1.6;
}
.form-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: var(--space-md, 16px);
}
.form-item label {
  font-size: 13px;
  color: var(--color-text-2, #666);
}
.form-input {
  height: 36px;
  padding: 0 12px;
  border: 1px solid var(--border-color, #e5e5e5);
  border-radius: var(--radius-sm, 6px);
  font-size: 14px;
  outline: none;
}
.form-input:focus {
  border-color: var(--color-primary, #1d4eff);
}
.form-actions {
  display: flex;
  gap: var(--space-sm, 12px);
  margin-top: var(--space-md, 24px);
}
.btn {
  height: 36px;
  padding: 0 18px;
  border-radius: var(--radius-sm, 6px);
  border: none;
  cursor: pointer;
  font-size: 14px;
}
.btn-primary {
  background: var(--color-primary, #1d4eff);
  color: #fff;
}
.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.btn-default {
  background: #f5f5f5;
  color: #333;
}
</style>
