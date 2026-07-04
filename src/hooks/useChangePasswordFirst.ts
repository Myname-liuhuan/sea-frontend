import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Message } from '@arco-design/web-vue'
import { useUserStore } from '@/store'
import { changePassword } from '@/api/auth'
import { RESPONSE_CODE } from '@/constants'
import { MIN_PASSWORD_LENGTH } from '@/constants/workflow'

/**
 * 强制改密页 hook：登录后必须改完密才能进入系统。
 */
export function useChangePasswordFirst() {
  const router = useRouter()
  const userStore = useUserStore()

  const form = reactive({
    newPassword: '',
    confirmPassword: '',
  })
  const loading = ref(false)

  async function handleSubmit() {
    const me = userStore.userInfo
    if (!me) {
      Message.error('请先登录')
      router.replace({ name: 'Login' })
      return
    }
    if (!form.newPassword || form.newPassword.length < MIN_PASSWORD_LENGTH) {
      Message.warning(`新密码至少 ${MIN_PASSWORD_LENGTH} 位`)
      return
    }
    if (form.newPassword !== form.confirmPassword) {
      Message.warning('两次密码输入不一致')
      return
    }

    loading.value = true
    try {
      // 强制改密首登场景下 oldPassword 不传，sea-system 跳过 BCrypt 比对
      const res = await changePassword(Number(me.id), form.newPassword)
      if (res.code !== RESPONSE_CODE.SUCCESS) return

      Message.success('密码已修改，请重新登录')
      userStore.clearMustChangePassword()
      userStore.clearToken()
      router.replace({ name: 'Login' })
    } finally {
      loading.value = false
    }
  }

  function handleLogout() {
    userStore.clearToken()
    router.replace({ name: 'Login' })
  }

  return {
    form,
    loading,
    handleSubmit,
    handleLogout,
  }
}
