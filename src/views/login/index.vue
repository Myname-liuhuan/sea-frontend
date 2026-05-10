<script setup lang="ts">
import { useLoginPage } from '@/hooks/useLoginPage'

const { form, loading, handleLogin } = useLoginPage()
</script>

<template>
  <div class="login-page">
    <div class="login-bg"></div>
    <div class="login-container">
      <div class="login-brand">
        <div class="brand-icon">
          <svg viewBox="0 0 32 32" fill="none">
            <path d="M16 4L28 10V22L16 28L4 22V10L16 4Z" stroke="currentColor" stroke-width="2"/>
            <path d="M16 10L22 13V19L16 22L10 19V13L16 10Z" fill="currentColor"/>
          </svg>
        </div>
        <h1 class="brand-title">Sea Admin</h1>
        <p class="brand-subtitle">管理系统</p>
      </div>

      <form class="login-form" @submit.prevent="handleLogin">
        <div class="form-item">
          <div class="form-label">用户名</div>
          <input
            v-model="form.username"
            type="text"
            class="form-input"
            placeholder="请输入用户名"
            autocomplete="username"
          />
        </div>

        <div class="form-item">
          <div class="form-label">密码</div>
          <input
            v-model="form.password"
            type="password"
            class="form-input"
            placeholder="请输入密码"
            autocomplete="current-password"
          />
        </div>

        <button type="submit" class="submit-btn" :disabled="loading">
          <span v-if="loading" class="loading-spinner"></span>
          <span v-else>登 录</span>
        </button>
      </form>

      <div class="login-footer">
        <span class="version">v1.0.0</span>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.login-bg {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse at 20% 30%, rgba(26, 26, 26, 0.03) 0%, transparent 50%),
    radial-gradient(ellipse at 80% 70%, rgba(26, 26, 26, 0.02) 0%, transparent 50%),
    linear-gradient(180deg, #fafafa 0%, #f5f5f5 100%);
}

.login-container {
  position: relative;
  width: 380px;
  padding: 48px 40px;
  animation: fadeIn 0.5s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
}

.login-brand {
  text-align: center;
  margin-bottom: 40px;
}

.brand-icon {
  width: 56px;
  height: 56px;
  margin: 0 auto 16px;
  color: var(--color-primary, #1a1a1a);

  svg { width: 100%; height: 100%; }
}

.brand-title {
  font-size: 24px;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0 0 4px;
  letter-spacing: 2px;
}

.brand-subtitle {
  font-size: 14px;
  color: #999;
  margin: 0;
  letter-spacing: 4px;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-label {
  font-size: 13px;
  font-weight: 500;
  color: #666;
}

.form-input {
  width: 100%;
  height: 44px;
  padding: 0 16px;
  font-size: 14px;
  color: #1a1a1a;
  background: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  outline: none;
  transition: all 0.2s ease;

  &::placeholder { color: #bfbfbf; }

  &:focus {
    border-color: #1a1a1a;
    box-shadow: 0 0 0 2px rgba(26, 26, 26, 0.06);
  }
}

.submit-btn {
  width: 100%;
  height: 44px;
  margin-top: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #fff;
  background: #1a1a1a;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover:not(:disabled) { background: #333; }
  &:disabled { opacity: 0.6; cursor: not-allowed; }
}

.loading-spinner {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.login-footer {
  margin-top: 32px;
  text-align: center;
}

.version {
  font-size: 12px;
  color: #bfbfbf;
}
</style>
