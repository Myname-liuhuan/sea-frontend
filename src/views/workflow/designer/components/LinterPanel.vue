<script setup lang="ts">
/**
 * BPMN 校验面板：显示 bpmn-js-bpmnlint 报告的错误和警告。
 *
 * 用法：
 *   const warnings = ref<LintWarning[]>([])
 *   function onLint(report: { warnings: LintWarning[] }) {
 *     warnings.value = report.warnings
 *   }
 *   <LinterPanel :warnings="warnings" />
 */

import { computed } from 'vue'

// bpmn-js-bpmnlint 没类型，按 bpmnlint 标准 warning 形状
interface LintWarning {
  id: string
  message: string
  category: string
  rule: string
}

const props = defineProps<{ warnings: LintWarning[] }>()

const grouped = computed(() => {
  const errs: LintWarning[] = []
  const warns: LintWarning[] = []
  for (const w of props.warnings) {
    if (w.category === 'error') errs.push(w)
    else warns.push(w)
  }
  return { errs, warns }
})

const hasIssue = computed(
  () => props.warnings.length > 0,
)
</script>

<template>
  <div v-if="hasIssue" class="linter-panel" :class="{ 'has-error': grouped.errs.length > 0 }">
    <div class="linter-header">
      <span class="title">校验</span>
      <span v-if="grouped.errs.length > 0" class="badge error">
        {{ grouped.errs.length }} 错误
      </span>
      <span v-if="grouped.warns.length > 0" class="badge warn">
        {{ grouped.warns.length }} 警告
      </span>
    </div>
    <ul class="linter-list">
      <li
        v-for="w in props.warnings"
        :key="w.id"
        class="linter-item"
        :class="w.category"
      >
        <span class="category-tag" :class="w.category">
          {{ w.category === 'error' ? '错' : '警' }}
        </span>
        <span class="message">{{ w.message }}</span>
      </li>
    </ul>
  </div>
</template>

<style scoped lang="scss">
.linter-panel {
  border-top: 1px solid var(--border-light);
  background: var(--bg-secondary);
  max-height: 240px;
  overflow-y: auto;
  flex-shrink: 0;

  &.has-error {
    border-top-color: var(--color-danger);
  }
}

.linter-header {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-md);
  border-bottom: 1px solid var(--border-light);
  background: var(--bg-tertiary);
  position: sticky;
  top: 0;
  z-index: 1;

  .title {
    font-size: 13px;
    font-weight: 600;
    color: var(--text-primary);
  }

  .badge {
    font-size: 12px;
    padding: 2px 8px;
    border-radius: 10px;
    font-weight: 500;

    &.error {
      background: rgba(var(--color-danger-rgb), 0.12);
      color: var(--color-danger);
    }
    &.warn {
      background: rgba(var(--color-warning-rgb), 0.12);
      color: var(--color-warning);
    }
  }
}

.linter-list {
  list-style: none;
  margin: 0;
  padding: var(--space-xs) 0;
}

.linter-item {
  display: flex;
  gap: var(--space-sm);
  padding: 6px var(--space-md);
  font-size: 12px;
  align-items: flex-start;

  &.error {
    background: rgba(var(--color-danger-rgb), 0.04);
  }
}

.category-tag {
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;

  &.error {
    background: var(--color-danger);
    color: white;
  }
  &.warn {
    background: var(--color-warning);
    color: white;
  }
}

.message {
  color: var(--text-primary);
  line-height: 1.5;
  word-break: break-word;
}
</style>