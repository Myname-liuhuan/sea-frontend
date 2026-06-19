import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { LoginUser } from '@/types'

const USER_INFO_KEY = 'userInfo'

function readPersistedUserInfo(): LoginUser | null {
  try {
    const raw = localStorage.getItem(USER_INFO_KEY)
    return raw ? (JSON.parse(raw) as LoginUser) : null
  } catch {
    return null
  }
}

export const useUserStore = defineStore('user', () => {
  const token = ref(localStorage.getItem('token') || '')
  // 从 localStorage 恢复，避免刷新后 banner 退回「用户」fallback
  const userInfo = ref<LoginUser | null>(readPersistedUserInfo())

  function setToken(val: string) {
    token.value = val
    localStorage.setItem('token', val)
  }

  function clearToken() {
    token.value = ''
    userInfo.value = null
    localStorage.removeItem('token')
    localStorage.removeItem(USER_INFO_KEY)
  }

  function setUserInfo(info: LoginUser) {
    userInfo.value = info
    localStorage.setItem(USER_INFO_KEY, JSON.stringify(info))
  }

  return {
    token,
    userInfo,
    setToken,
    clearToken,
    setUserInfo,
  }
})
