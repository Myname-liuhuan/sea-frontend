import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUserStore = defineStore('user', () => {
  const token = ref(localStorage.getItem('token') || '')
  const userInfo = ref<Record<string, unknown>>({})

  function setToken(val: string) {
    token.value = val
    localStorage.setItem('token', val)
  }

  function clearToken() {
    token.value = ''
    localStorage.removeItem('token')
  }

  function setUserInfo(info: Record<string, unknown>) {
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
