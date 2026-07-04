import { reactive, ref } from 'vue'
import { Message } from '@arco-design/web-vue'
import { applyResetPassword } from '@/api/workflow/apply'
import type { ApplyRequest, ApplyResult } from '@/types/workflow'
import { RESPONSE_CODE } from '@/constants'

/**
 * 重置密码申请表单 hook：被用户列表操作列嵌入的弹窗复用。
 *
 * @example
 *   const { modalVisible, form, urgencyOptions, submit } = usePasswordResetApply(currentRow)
 *   submit() 后：success → 关闭弹窗，给出工单号提示
 */
export function usePasswordResetApply(row: { id: number; username?: string }) {
  const modalVisible = ref(false)
  const loading = ref(false)

  const form = reactive<ApplyRequest>({
    targetUserId: row.id,
    reason: '',
    urgency: 1,
  })

  const urgencyOptions = [
    { value: 1, label: '普通' },
    { value: 2, label: '紧急' },
  ]

  /** 打开弹窗：把目标用户回填到只读字段 */
  function open() {
    form.targetUserId = row.id
    form.reason = ''
    form.urgency = 1
    modalVisible.value = true
  }

  /** 关闭弹窗 */
  function close() {
    modalVisible.value = false
  }

  /** 提交：成功后回写 taskNo 给业务回调 */
  async function submit(onSuccess?: (r: ApplyResult) => void) {
    if (!form.reason.trim()) {
      Message.warning('请填写申请原因')
      return
    }
    if (form.reason.length > 500) {
      Message.warning('申请原因不能超过 500 字')
      return
    }
    loading.value = true
    try {
      // 简单的客户端幂等键：时间戳
      const key = `apply-${row.id}-${Date.now()}`
      const res = await applyResetPassword(form, key)
      if (res.code !== RESPONSE_CODE.SUCCESS) return
      Message.success(`工单 ${res.data.taskNo} 已提交`)
      modalVisible.value = false
      onSuccess?.(res.data)
    } finally {
      loading.value = false
    }
  }

  return {
    modalVisible,
    loading,
    form,
    urgencyOptions,
    open,
    close,
    submit,
  }
}
