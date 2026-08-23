<script setup lang="ts">
import { Modal as AModal } from '@arco-design/web-vue'
import { usePasswordResetApply } from '@/hooks/usePasswordResetApply'

const props = defineProps<{
  // 当前操作的目标用户：只用于回填 targetUserId 与展示
  targetUser: { id: number | string; username?: string }
}>()

const emit = defineEmits<{
  (e: 'submitted', taskNo: string): void
}>()

// 注意：必须传 props.targetUser 的 toRef，避免父组件整对象替换时 hook 内部
// 闭包仍指向 setup 阶段拿到的旧对象引用。
const { modalVisible, loading, form, urgencyOptions, open, close, submit } =
  usePasswordResetApply(() => props.targetUser)

defineExpose({ open, close })

/**
 * Arco Modal 的 @before-ok 钩子：返回 false 阻止关闭。
 * 前端校验失败时返回 false，成功后返回 true 让 Modal 走默认关闭。
 */
async function onBeforeOk(): Promise<boolean> {
  return await submit((r) => emit('submitted', r.taskNo))
}
</script>

<template>
  <AModal
    v-model:visible="modalVisible"
    title="申请重置密码"
    :ok-loading="loading"
    :ok-text="'提交申请'"
    :cancel-text="'取消'"
    :width="480"
    @before-ok="onBeforeOk"
    @cancel="close"
    @close="close"
  >
    <a-form :model="form" label-align="left">
      <a-form-item label="目标用户" :span="24">
        <a-input
          :model-value="props.targetUser.username || String(props.targetUser.id)"
          readonly
          disabled
        />
      </a-form-item>
      <a-form-item label="申请原因" :span="24" required>
        <a-textarea
          v-model:model-value="form.reason"
          :max-length="500"
          :auto-size="{ minRows: 3, maxRows: 6 }"
          placeholder="请说明申请原因（不超过 500 字）"
          allow-clear
        />
      </a-form-item>
      <a-form-item label="紧急程度" :span="24" required>
        <a-radio-group v-model:model-value="form.urgency">
          <a-radio v-for="opt in urgencyOptions" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </a-radio>
        </a-radio-group>
      </a-form-item>
    </a-form>
  </AModal>
</template>
