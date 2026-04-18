<script setup lang="ts">
import { reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores'
import { Message } from '@arco-design/web-vue'

const router = useRouter()
const userStore = useUserStore()

const form = reactive({
  username: '',
  password: '',
})

async function handleLogin() {
  if (!form.username || !form.password) {
    Message.warning('请输入用户名和密码')
    return
  }
  // TODO: 调用真实登录接口
  userStore.setToken('mock-token')
  Message.success('登录成功')
  router.push('/')
}
</script>

<template>
  <div class="login-page">
    <a-card class="login-card" :bordered="false">
      <a-typography-title :heading="3" style="text-align: center; margin-bottom: 32px">
        Sea 管理系统
      </a-typography-title>
      <a-form :model="form" layout="vertical" @submit-success="handleLogin">
        <a-form-item field="username" label="用户名" :rules="[{ required: true, message: '请输入用户名' }]">
          <a-input v-model="form.username" placeholder="请输入用户名" />
        </a-form-item>
        <a-form-item field="password" label="密码" :rules="[{ required: true, message: '请输入密码' }]">
          <a-input-password v-model="form.password" placeholder="请输入密码" />
        </a-form-item>
        <a-form-item>
          <a-button type="primary" html-type="submit" long>登 录</a-button>
        </a-form-item>
      </a-form>
    </a-card>
  </div>
</template>

<style scoped lang="scss">
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-bg-1);
}

.login-card {
  width: 400px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}
</style>
