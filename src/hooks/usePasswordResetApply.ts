import { reactive, ref } from 'vue'
import { Message } from '@arco-design/web-vue'
import { applyResetPassword } from '@/api/workflow/apply'
import type { ApplyRequest, ApplyResult } from '@/types/workflow'
import { RESPONSE_CODE } from '@/constants'
import { APPLY_REASON_MAX_LENGTH } from '@/constants/workflow'

/**
 * 重置密码申请表单 hook：被用户列表操作列嵌入的弹窗复用。
 *
 * <p>注意：{@code row} 是 props 传进来的引用（创建 hook 时拿一次），
 * 所以每次 open() 必须按当前 {@code row.id} 重新赋值 {@code form.targetUserId}，
 * 否则在打开 modal 之前 props 变化（比如切到另一个用户行）会拿到旧值。
 *
 * @example
 *   const { modalVisible, form, urgencyOptions, submit } = usePasswordResetApply(currentRow)
 *   submit() 后：success → 关闭弹窗，给出工单号提示
 */
/**
 * 重置密码申请表单 hook：被用户列表操作列嵌入的弹窗复用。
 *
 * <p>参数 {@code getRow} 必须传 getter 而非对象引用，否则父组件整对象替换
 * （applyTarget 从 null 切到 {id:2}）时，setup 阶段拿到的旧引用仍指向 {id:0}，
 * 导致 modal 提交时 {@code targetUserId} 始终是默认值。
 *
 * @example
 *   const { modalVisible, form, urgencyOptions, submit } = usePasswordResetApply(() => currentRow)
 *   submit() 后：success → 关闭弹窗，给出工单号提示
 */
export function usePasswordResetApply(
  getRow: () => { id: number | string; username?: string },
) {
  const modalVisible = ref(false)
  const loading = ref(false)

  const form = reactive<ApplyRequest>({
    targetUserId: Number(getRow().id),
    reason: '',
    urgency: 1,
  })

  const urgencyOptions = [
    { value: 1, label: '普通' },
    { value: 2, label: '紧急' },
  ]

  /**
   * 打开弹窗：可选地传入当前行，传了则用它（避免 Vue 同步写 ref 后 props
   * 还没在下一个 tick 反映出来导致读到旧值）；不传则用 getRow()。
   */
  function open(row?: { id: number | string; username?: string }) {
    const cur = row ?? getRow()
    form.targetUserId = Number(cur.id)
    form.reason = ''
    form.urgency = 1
    modalVisible.value = true
  }

  /** 关闭弹窗 */
  function close() {
    modalVisible.value = false
  }

  /** 提交：成功后回写 taskNo 给业务回调，返回是否成功（前端校验失败也返回 false，避免 Arco Modal @ok 自动关闭） */
  async function submit(onSuccess?: (r: ApplyResult) => void): Promise<boolean> {
    if (!form.reason.trim()) {
      Message.warning('请填写申请原因')
      return false
    }
    if (form.reason.length > APPLY_REASON_MAX_LENGTH) {
      Message.warning(`申请原因不能超过 ${APPLY_REASON_MAX_LENGTH} 字`)
      return false
    }
    loading.value = true
    try {
      // 简单的客户端幂等键：时间戳
      const key = `apply-${getRow().id}-${Date.now()}`
      const res = await applyResetPassword(form, key)
      if (res.code !== RESPONSE_CODE.SUCCESS) return false
      Message.success(`工单 ${res.data.taskNo} 已提交`)
      modalVisible.value = false
      onSuccess?.(res.data)
      return true
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
