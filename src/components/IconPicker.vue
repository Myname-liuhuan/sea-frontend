<script setup lang="ts">
import { ref, computed } from 'vue'
import * as arcoIcons from '@arco-design/web-vue/es/icon'

const props = defineProps<{
  modelValue?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const visible = ref(false)
const searchValue = ref('')
const selectedIcon = ref(props.modelValue || '')

// 获取所有图标名称
const allIcons = computed(() => {
  return Object.keys(arcoIcons).filter((name) => name.startsWith('Icon'))
})

// 过滤后的图标
const filteredIcons = computed(() => {
  if (!searchValue.value) return allIcons.value
  const search = searchValue.value.toLowerCase()
  return allIcons.value.filter((name) => name.toLowerCase().includes(search))
})

function selectIcon(name: string) {
  selectedIcon.value = name
  emit('update:modelValue', name)
  visible.value = false
}

function open() {
  selectedIcon.value = props.modelValue || ''
  visible.value = true
}

// 将图标名称转换为组件
function getIconComponent(name: string) {
  return (arcoIcons as Record<string, unknown>)[name]
}
</script>

<template>
  <div>
    <a-input
      :model-value="modelValue"
      readonly
      placeholder="请选择图标"
      @click="open"
    >
      <template #prefix>
        <component :is="getIconComponent(modelValue || '')" v-if="modelValue" />
      </template>
    </a-input>

    <a-modal
      v-model:visible="visible"
      title="选择图标"
      width="680px"
      :footer="null"
    >
      <a-input
        v-model="searchValue"
        placeholder="搜索图标..."
        allow-clear
        style="margin-bottom: 16px"
      >
        <template #prefix><icon-search /></template>
      </a-input>

      <div class="icon-grid">
        <div
          v-for="iconName in filteredIcons"
          :key="iconName"
          :class="['icon-item', { selected: selectedIcon === iconName }]"
          @click="selectIcon(iconName)"
        >
          <component :is="getIconComponent(iconName)" />
          <span class="icon-name">{{ iconName.replace('Icon', '') }}</span>
        </div>
      </div>

      <a-empty v-if="filteredIcons.length === 0" description="未找到匹配图标" />
    </a-modal>
  </div>
</template>

<style scoped lang="scss">
.icon-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 8px;
  max-height: 400px;
  overflow-y: auto;
  padding: 8px;
}

.icon-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 12px 8px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid transparent;

  &:hover {
    background: var(--color-fill-light);
  }

  &.selected {
    background: var(--color-primary-light-1);
    border-color: rgb(var(--primary-6));
  }

  .icon-name {
    margin-top: 4px;
    font-size: 11px;
    color: var(--color-text-3);
    text-align: center;
    word-break: break-all;
  }
}
</style>
