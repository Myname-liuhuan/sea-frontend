<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useModelDesigner } from '@/hooks/useModelDesigner'
import {
  BPMN_CANVAS_MIN_HEIGHT,
  BPMN_PROPERTIES_PANEL_WIDTH,
  WORKFLOW_MODEL_PERMS,
} from '@/constants/workflow'

const canvasRef = ref<HTMLDivElement | null>(null)
const panelRef = ref<HTMLDivElement | null>(null)

const {
  metaForm,
  loading,
  saving,
  deploying,
  initModeler,
  saveMeta,
  saveBpmn,
  deploy,
} = useModelDesigner()

onMounted(async () => {
  if (canvasRef.value && panelRef.value) {
    await initModeler(canvasRef.value, panelRef.value)
  }
})
</script>

<template>
  <div class="designer-page">
    <!-- 顶部工具栏 -->
    <div class="designer-toolbar">
      <div class="meta-form">
        <div class="form-item">
          <label>名称</label>
          <input v-model="metaForm.name" :disabled="loading" class="search-input" />
        </div>
        <div class="form-item">
          <label>Key</label>
          <input v-model="metaForm.key" :disabled="loading" class="search-input" />
        </div>
        <div class="form-item">
          <label>业务类型</label>
          <input
            v-model="metaForm.businessType"
            :disabled="loading"
            placeholder="如 LEAVE"
            class="search-input"
          />
        </div>
        <div class="form-item grow">
          <label>描述</label>
          <input
            v-model="metaForm.description"
            :disabled="loading"
            class="search-input"
          />
        </div>
      </div>
      <div class="actions">
        <button
          class="btn btn-default"
          :disabled="loading || saving"
          v-has-permi="WORKFLOW_MODEL_PERMS.WRITE"
          @click="saveMeta"
        >
          保存元数据
        </button>
        <button
          class="btn btn-primary"
          :disabled="loading || saving"
          v-has-permi="WORKFLOW_MODEL_PERMS.WRITE"
          @click="saveBpmn"
        >
          {{ saving ? '保存中…' : '保存 BPMN' }}
        </button>
        <button
          class="btn btn-primary"
          :disabled="loading || deploying"
          v-has-permi="WORKFLOW_MODEL_PERMS.DEPLOY"
          @click="deploy"
        >
          {{ deploying ? '部署中…' : '部署' }}
        </button>
      </div>
    </div>

    <!-- 画布 + 属性面板 -->
    <div class="designer-body">
      <div
        ref="canvasRef"
        class="bpmn-canvas"
        :style="{ minHeight: BPMN_CANVAS_MIN_HEIGHT + 'px' }"
      />
      <div
        ref="panelRef"
        class="bpmn-panel"
        :style="{ width: BPMN_PROPERTIES_PANEL_WIDTH + 'px' }"
      />
      <div v-if="loading" class="loading-mask">加载中…</div>
    </div>
  </div>
</template>

<style scoped lang="scss">
/* bpmn-js 自带 css 仅在组件 scope 内生效，避免污染全局 */
@import 'bpmn-js/dist/assets/diagram-js.css';
@import 'bpmn-js/dist/assets/bpmn-font/css/bpmn.css';
@import 'bpmn-js/dist/assets/bpmn-js.css';
/* bpmn-js-properties-panel 不附带 css，由 JS 注入到 head */

.designer-page {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  height: calc(100vh - 100px);
}

.designer-toolbar {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--space-md);
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
  padding: var(--space-md) var(--space-lg);
  border: 1px solid var(--border-light);
}

.meta-form {
  display: flex;
  gap: var(--space-md);
  align-items: flex-end;
  flex: 1;
  min-width: 0;
}

.form-item {
  display: flex;
  flex-direction: column;
  gap: 6px;

  label {
    font-size: 12px;
    color: var(--text-secondary);
    font-weight: 500;
  }

  &.grow {
    flex: 1;
    min-width: 200px;
  }
}

.search-input {
  width: 100%;
  height: 36px;
  padding: 0 12px;
  font-size: 13px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  outline: none;

  &:focus {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 2px rgba(var(--color-primary-rgb), 0.06);
  }
  &:disabled {
    background: var(--bg-primary);
    color: var(--text-tertiary);
  }
}

.actions {
  display: flex;
  gap: var(--space-sm);
  flex-shrink: 0;
}

.btn {
  height: 36px;
  padding: 0 16px;
  font-size: 13px;
  font-weight: 500;
  border-radius: var(--radius-sm);
  cursor: pointer;
  border: none;
  transition: all var(--transition-base);

  &:disabled { opacity: 0.5; cursor: not-allowed; }
}

.btn-primary {
  background: var(--color-primary);
  color: var(--bg-secondary);
  &:hover:not(:disabled) { background: var(--color-primary-light); }
}

.btn-default {
  background: var(--bg-secondary);
  color: var(--color-primary-light);
  border: 1px solid var(--border-color);
  &:hover:not(:disabled) { background: var(--bg-primary); }
}

.designer-body {
  display: flex;
  flex: 1;
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-light);
  overflow: hidden;
  position: relative;
}

.bpmn-canvas {
  flex: 1;
  position: relative;

  :deep(.djs-container) {
    background: var(--bg-tertiary);
  }
}

.bpmn-panel {
  border-left: 1px solid var(--border-light);
  overflow-y: auto;
  background: var(--bg-secondary);
  flex-shrink: 0;
}

.loading-mask {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
  background: rgba(255, 255, 255, 0.6);
  z-index: 10;
}
</style>