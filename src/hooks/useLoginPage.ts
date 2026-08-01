import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Message } from '@arco-design/web-vue'
import { useUserStore } from '@/store'
import { useMenuStore } from '@/store/menu'
import { login } from '@/api/auth'
import { getLoginUser } from '@/api/system/user'
import { getMyMenuTree } from '@/api/system/menu'
import { RESPONSE_CODE } from '@/constants'
import type { LoginUser } from '@/types'

interface LoginForm {
  username: string
  password: string
}

export function useLoginPage() {
  const router = useRouter()
  const userStore = useUserStore()
  const menuStore = useMenuStore()

  const form = reactive<LoginForm>({
    username: '',
    password: '',
  })
  const loading = ref(false)

  async function processLogin(): Promise<void> {
    const loginRes = await login({
      username: form.username,
      password: form.password,
    })
    if (loginRes.code !== RESPONSE_CODE.SUCCESS) return

    // token 先落，后续步骤失败时由 finally 回滚
    userStore.setToken(loginRes.data.accessToken)

    try {
      await loadUserInfo()
      await loadMenuTree()

      if (loginRes.data.mustChangePassword) {
        Message.warning('密码为临时密码，请先修改')
        router.replace('/change-password-first')
        return
      }

      Message.success('登录成功')
      // 使用 replace 触发守卫；守卫会拉菜单树并注入动态路由
      router.replace('/')
    } catch (err) {
      // 回滚：避免用户拿到 token 但没菜单/用户信息的中间状态
      userStore.clearToken()
      menuStore.clearMenuTree()
      Message.error(err instanceof Error ? err.message : '获取用户信息失败，请重新登录')
      throw err
    }
  }

  async function loadUserInfo(): Promise<void> {
    const userRes = await getLoginUser(form.username)
    if (userRes.code !== RESPONSE_CODE.SUCCESS) {
      throw new Error(userRes.message || '获取用户信息失败')
    }
    userStore.setUserInfo(userRes.data as LoginUser)
  }

  async function loadMenuTree(): Promise<void> {
    const menuRes = await getMyMenuTree()
    if (menuRes.code !== RESPONSE_CODE.SUCCESS) {
      throw new Error(menuRes.message || '获取菜单失败')
    }
    menuStore.setMenuTree(menuRes.data)
  }

  async function handleLogin(): Promise<void> {
    if (!form.username || !form.password) {
      Message.warning('请输入用户名和密码')
      return
    }

    loading.value = true
    try {
      await processLogin()
    } finally {
      loading.value = false
    }
  }

  return {
    form,
    loading,
    handleLogin,
  }
}
