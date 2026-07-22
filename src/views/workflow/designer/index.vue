<script setup lang="ts">
// bpmn-js 自带 CSS 必须作为全局副作用导入，不能放进 scoped style 块
// 否则 scoped 会给所有选择器加 data-v-XXX 属性，把 .djs-palette { position:absolute } 这类默认样式盖掉
import 'bpmn-js/dist/assets/diagram-js.css'
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn.css'
import 'bpmn-js/dist/assets/bpmn-js.css'
import 'diagram-js-minimap/assets/diagram-js-minimap.css'

import { computed, onMounted, ref } from 'vue'
import { Message } from '@arco-design/web-vue'
import { useModelDesigner } from '@/hooks/useModelDesigner'
import {
  BPMN_CANVAS_MIN_HEIGHT,
  BPMN_PROPERTIES_PANEL_WIDTH,
  WORKFLOW_MODEL_PERMS,
} from '@/constants/workflow'
import LinterPanel from './components/LinterPanel.vue'
import ZoomControls from './components/ZoomControls.vue'
import MinimapPanel from './components/MinimapPanel.vue'
import VersionsPanel from './components/VersionsPanel.vue'
import DiffView from './components/DiffView.vue'
import FlowablePropertyPanel from './components/FlowablePropertyPanel.vue'

const canvasRef = ref<HTMLDivElement | null>(null)

const {
  metaForm,
  loading,
  saving,
  deploying,
  modeler,
  lintWarnings,
  modelId,
  currentXml,
  initModeler,
  saveMeta,
  saveBpmn,
  deploy,
  regenerateIds,
  applyHistoryXml,
} = useModelDesigner()

const modelerForZoom = computed(() => modeler.value as unknown)
const modelerForPanel = computed(() => modeler.value as { get: (n: string) => unknown } | null)

/** Diff 弹窗 */
const diffOpen = ref(false)
const diffVersion = ref<number | null>(null)
const diffTargetXml = ref<string>('')

function onShowDiff(payload: { version: number; xml: string }): void {
  diffVersion.value = payload.version
  diffTargetXml.value = payload.xml
  diffOpen.value = true
}

async function onRolledBack(): Promise<void> {
  if (diffVersion.value == null) return
  await applyHistoryXml(diffVersion.value)
  Message.success('画布已重载为回滚版本')
}

onMounted(async () => {
  if (canvasRef.value) {
    await initModeler(canvasRef.value)
  }
})
</script>

<template>
  <div class="designer-page">
    <!-- 顶部元数据工具栏 -->
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
        <button
          class="btn btn-default"
          :disabled="!modeler"
          v-has-permi="WORKFLOW_MODEL_PERMS.WRITE"
          title="把所有节点 ID 重命名为 类型_序号 风格"
          @click="regenerateIds"
        >
          重置 ID
        </button>
      </div>
    </div>

    <!-- 三栏：Palette | Canvas + Minimap + Zoom + Lint + Versions | Properties -->
    <div class="designer-body">
      <div class="designer-palette">
        <div class="designer-canvas">
          <div
            ref="canvasRef"
            class="bpmn-canvas-host"
            :style="{ minHeight: BPMN_CANVAS_MIN_HEIGHT + 'px' }"
          />
          <MinimapPanel v-if="modeler" />
          <ZoomControls v-if="modeler" :modeler="modelerForZoom" />
          <LinterPanel :warnings="lintWarnings" />
          <VersionsPanel
            :model-id="modelId"
            :current-xml="currentXml"
            @diff="onShowDiff"
            @rolled-back="onRolledBack"
          />
          <div v-if="loading" class="loading-mask">加载中…</div>
        </div>
      </div>

      <div
        class="designer-properties"
        :style="{ width: BPMN_PROPERTIES_PANEL_WIDTH + 'px' }"
      >
        <FlowablePropertyPanel :modeler="modelerForPanel" />
      </div>
    </div>

    <!-- Diff 弹窗 -->
    <DiffView
      v-if="diffOpen && diffVersion != null"
      :baseline="currentXml"
      :target="diffTargetXml"
      :baseline-label="`当前版本`"
      :target-label="`历史 v${diffVersion}`"
      @close="diffOpen = false"
    />
  </div>
</template>

<style scoped lang="scss">
/* bpmn-js / minimap 的 css 已通过 <script> 全局 import，避免 scoped 加 data-v 属性覆盖默认 position */

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
}

.designer-palette {
  flex: 1;
  display: flex;
  position: relative;
  min-width: 0;
}

.designer-canvas {
  flex: 1;
  position: relative;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.bpmn-canvas-host {
  flex: 1;
  position: relative;
  min-width: 0;

  :deep(.djs-container) {
    background: var(--bg-tertiary);
  }
}

.designer-properties {
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