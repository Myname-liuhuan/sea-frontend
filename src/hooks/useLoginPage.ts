import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Message } from '@arco-design/web-vue'
import { useUserStore } from '@/store'
import { useMenuStore } from '@/store/menu'
import { login } from '@/api/auth'
import { getLoginUser } from '@/api/user'
import { getMyMenuTree } from '@/api/menu'
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

    userStore.setToken(loginRes.data.accessToken)
    await loadUserInfo()
    await loadMenuTree()
    Message.success('登录成功')
    router.push('/')
  }

  async function loadUserInfo(): Promise<void> {
    const userRes = await getLoginUser(form.username)
    if (userRes.code === RESPONSE_CODE.SUCCESS) {
      userStore.setUserInfo(userRes.data as LoginUser)
    }
  }

  async function loadMenuTree(): Promise<void> {
    const menuRes = await getMyMenuTree()
    if (menuRes.code === RESPONSE_CODE.SUCCESS) {
      menuStore.setMenuTree(menuRes.data)
    }
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
