import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { LoginUser } from '@/types'

export const useUserStore = defineStore('user', () => {
  const token = ref(localStorage.getItem('token') || '')
  const userInfo = ref<LoginUser | null>(null)

  function setToken(val: string) {
    token.value = val
    localStorage.setItem('token', val)
  }

  function clearToken() {
    token.value = ''
    userInfo.value = null
    localStorage.removeItem('token')
  }

  function setUserInfo(info: LoginUser) {
    userInfo.value = info
  }

  return {
    token,
    userInfo,
    setToken,
    clearToken,
    setUserInfo,
  }
})
