<script setup lang="ts">
import { ref } from 'vue'

defineProps<{
  title?: string
  content?: string
}>()

const emit = defineEmits<{
  confirm: []
}>()

const visible = ref(false)
let resolvePromise: (() => void) | null = null

function open() {
  visible.value = true
  return new Promise<void>((resolve) => {
    resolvePromise = resolve
  })
}

function handleConfirm() {
  visible.value = false
  emit('confirm')
  resolvePromise?.()
}

function handleCancel() {
  visible.value = false
  resolvePromise = null
}

// 暴露方法给父组件
defineExpose({ open })
</script>

<template>
  <a-modal
    v-model:visible="visible"
    :title="title || '确认操作'"
    :ok-text="'确定'"
    :cancel-text="'取消'"
    @ok="handleConfirm"
    @cancel="handleCancel"
  >
    <div style="padding: 8px 0">
      {{ content || '确定要执行此操作吗？' }}
    </div>
  </a-modal>
</template>
