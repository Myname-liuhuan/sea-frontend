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
  /**
   * 是否需要强制改密（重置密码工单后首登）。
   * 与 LoginUser.requirePasswordChange 同步。
   */
  const mustChangePassword = ref(
    readPersistedUserInfo()?.requirePasswordChange === true,
  )

  function setToken(val: string) {
    token.value = val
    localStorage.setItem('token', val)
  }

  function clearToken() {
    token.value = ''
    userInfo.value = null
    mustChangePassword.value = false
    localStorage.removeItem('token')
    localStorage.removeItem(USER_INFO_KEY)
  }

  function setUserInfo(info: LoginUser) {
    userInfo.value = info
    mustChangePassword.value = info.requirePasswordChange === true
    localStorage.setItem(USER_INFO_KEY, JSON.stringify(info))
  }

  function clearMustChangePassword() {
    mustChangePassword.value = false
  }

  return {
    token,
    userInfo,
    mustChangePassword,
    setToken,
    clearToken,
    setUserInfo,
    clearMustChangePassword,
  }
})
