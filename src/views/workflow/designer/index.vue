<script setup lang="ts">
// bpmn-js / bpmn-js-properties-panel 自带 CSS 必须作为全局副作用导入，
// 不能放进 scoped style 块 —— 否则 scoped 会给所有选择器加 data-v-XXX，
// 把 .djs-palette { position:absolute } 这类默认样式盖掉。
//
// 三个 CSS 各自负责：
// - bpmn-js/dist/assets/diagram-js.css        画布、palette 容器基础样式
// - bpmn-js/dist/assets/bpmn-font/css/bpmn.css 图标字体（开始/结束/用户任务 等）
// - bpmn-js/dist/assets/bpmn-js.css            palette 元素默认尺寸
// - diagram-js-minimap/...css                 缩略图样式
// - @bpmn-io/properties-panel/...css          官方属性面板
import 'bpmn-js/dist/assets/diagram-js.css'
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn.css'
import 'bpmn-js/dist/assets/bpmn-js.css'
import 'diagram-js-minimap/assets/diagram-js-minimap.css'
import '@bpmn-io/properties-panel/assets/properties-panel.css'

import { computed, onMounted, ref } from 'vue'
import { Message } from '@arco-design/web-vue'
import { useModelDesigner } from '@/hooks/useModelDesigner'
import {
  BPMN_CANVAS_MIN_HEIGHT,
  BPMN_PROPERTIES_PANEL_WIDTH,
  WORKFLOW_MODEL_PERMS,
} from '@/constants/workflow'

/**
 * 属性面板收起态宽度（px）。展开态用常量 BPMN_PROPERTIES_PANEL_WIDTH（288）。
 * 36px 刚好容纳一个折叠按钮 + 极简文字提示。
 */
const PROPERTIES_COLLAPSED_WIDTH = 36
import LinterPanel from './components/LinterPanel.vue'
import ZoomControls from './components/ZoomControls.vue'
import MinimapPanel from './components/MinimapPanel.vue'
import VersionsPanel from './components/VersionsPanel.vue'
import DiffView from './components/DiffView.vue'

const canvasRef = ref<HTMLDivElement | null>(null)
const propertiesRef = ref<HTMLDivElement | null>(null)

/**
 * 属性面板折叠状态。
 *
 * - 默认 false（展开）：看元素属性用。
 * - 用户点折叠按钮后变 true：画布占满横向。
 * - 仅改容器 width / overflow，bpmn-js-properties-panel 的内部 DOM 不卸载，
 *   避免重新渲染带来的视觉抖动。
 */
const propertiesCollapsed = ref(false)
function toggleProperties(): void {
  propertiesCollapsed.value = !propertiesCollapsed.value
}

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
  if (canvasRef.value && propertiesRef.value) {
    try {
      await initModeler(canvasRef.value, propertiesRef.value)
    } catch (e) {
      // 之前这里没 catch，导致 Vue 抛"Unhandled error during execution of mounted hook"
      // 实际上 initModeler 内部已经 try/catch 过主要步骤了；这里兜底防止后续
      // 任何新增代码意外抛出，让按钮永远卡在 disabled 状态。
      const err = e as Error
      console.error('[designer] initModeler 抛出未捕获异常', err)
      Message.error(`设计器初始化失败：${err.message ?? '未知错误'}`)
    }
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
          :disabled="loading || saving || !modeler"
          v-has-permi="WORKFLOW_MODEL_PERMS.WRITE"
          :title="!modeler && !loading ? '设计器尚未初始化完成' : ''"
          @click="saveBpmn"
        >
          {{ saving ? '保存中…' : '保存 BPMN' }}
        </button>
        <button
          class="btn btn-primary"
          :disabled="loading || deploying || !modeler"
          v-has-permi="WORKFLOW_MODEL_PERMS.DEPLOY"
          :title="!modeler && !loading ? '设计器尚未初始化完成' : ''"
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

    <!-- 三栏：Canvas + Minimap + Zoom + Lint + Versions | Properties -->
    <div class="designer-body">
      <div class="designer-canvas-wrap">
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

      <!--
        bpmn-js-properties-panel 通过 propertiesPanel.parent 挂到这个 div，
        渲染完整的 BPMN + Camunda/Flowable 属性面板（社区包实现，覆盖所有元素类型）。

        折叠按钮：absolute 贴在 panel 左上边缘 —— 不管折叠态还是展开态都常驻可见，
        让用户始终能找到"展开/收起"入口。折叠态下属性面板的内容隐藏（opacity:0 + pointer-events:none），
        panel DOM 仍保留以便 bpmn-js-properties-panel 不重新挂载。
      -->
      <div
        ref="propertiesRef"
        class="designer-properties"
        :class="{ collapsed: propertiesCollapsed }"
        :style="{
          width: propertiesCollapsed
            ? PROPERTIES_COLLAPSED_WIDTH + 'px'
            : BPMN_PROPERTIES_PANEL_WIDTH + 'px',
        }"
      >
        <button
          class="properties-toggle"
          :title="propertiesCollapsed ? '展开属性面板' : '收起属性面板'"
          :aria-label="propertiesCollapsed ? '展开属性面板' : '收起属性面板'"
          @click="toggleProperties"
        >
          <!-- CSS chevron：朝右表示"收起"（箭头指向画布），朝左表示"展开" -->
          <span class="chevron" :class="{ collapsed: propertiesCollapsed }" />
        </button>
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
/*
 * 设计原则：bpmn-js / bpmn-js-properties-panel 自带 CSS 已通过 <script> 全局 import，
 * 这里只做最小覆盖把它对齐到 Sea 设计系统（圆角、间距、字体、配色），
 * 不重写组件库自己的结构 —— 社区包的成熟度比手撸高得多。
 */

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

.designer-canvas-wrap {
  flex: 1;
  display: flex;
  position: relative;
  min-width: 0;
  background: var(--bg-secondary);
}

.bpmn-canvas-host {
  flex: 1;
  position: relative;
  min-width: 0;

  :deep(.djs-container) {
    background: var(--bg-tertiary);
  }

  /*
   * Palette 视觉对齐 Sea 设计系统。
   * 工具提示（title）由 installChineseI18n() 注入的中文翻译负责，
   * 这里只负责容器外观 + entry 间距。
   */
  :deep(.djs-palette) {
    top: 16px;
    left: 16px;
    border-radius: var(--radius-lg);
    border: 1px solid var(--border-light);
    background: var(--bg-secondary);
    box-shadow: var(--shadow-md);
  }

  :deep(.djs-palette .entry) {
    color: var(--text-secondary);
    transition: color var(--transition-fast), background var(--transition-fast);
    border-radius: var(--radius-sm);
    margin: 2px;

    &:hover {
      color: var(--color-primary);
      background: var(--bg-tertiary);
    }
  }

  :deep(.djs-palette .separator) {
    margin: 4px 6px;
    padding: 0;
    height: 1px;
    border: none;
    background: var(--border-light);
  }
}

.designer-properties {
  position: relative;
  border-left: 1px solid var(--border-light);
  background: var(--bg-secondary);
  flex-shrink: 0;
  overflow: hidden;
  transition: width 0.22s cubic-bezier(0.4, 0, 0.2, 1);

  /*
   * 折叠态：把 bpmn-js-properties-panel 渲染出来的内容隐掉。
   * 用 opacity 而不是 display:none，避免卸载 DOM 引发重新初始化开销；
   * pointer-events:none 让点击穿透到折叠态下的 hint 文字。
   */
  &.collapsed {
    :deep(.bio-properties-panel-container) {
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.18s ease;
    }
  }

  /*
   * 紧凑模式：把 bpmn-js-properties-panel 的内置间距压下来，让 240px 宽度
   * 能容下全部 entry。bpmn-io 公开的 .bio-properties-panel-* class 是稳定 API，
   * 跨版本可以放心 override padding / height / font-size 这些纯视觉属性。
   */
  :deep(.bio-properties-panel-container) {
    font-size: 12px;
  }

  :deep(.bio-properties-panel-header) {
    padding: 8px 12px;

    .bio-properties-panel-icon {
      width: 20px;
      height: 20px;
    }
  }

  :deep(.bio-properties-panel-group) {
    padding: 8px 12px;
    border-bottom: 1px solid var(--border-light);

    .bio-properties-panel-group-header {
      padding: 4px 0;
      margin-bottom: 4px;
    }

    .bio-properties-panel-group-header-title {
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 0.2px;
    }
  }

  :deep(.bio-properties-panel-entry) {
    margin-bottom: 6px;

    .bio-properties-panel-label {
      margin-bottom: 3px;
      font-size: 11px;
    }
  }

  :deep(.bio-properties-panel-input) {
    min-height: 26px;
    font-size: 12px;
  }

  :deep(.bio-properties-panel-textfield) input,
  :deep(.bio-properties-panel-select) select {
    height: 26px;
    padding: 0 8px;
  }

  :deep(.bio-properties-panel-list-entry) {
    margin: 4px 0;
    padding: 6px;
  }

  /*
   * 折叠按钮：吸在 panel 左上边缘外侧（-8px 偏移），形成"把手"感。
   * 不管展开 / 折叠都常驻可见，永远给用户一个出入口。
   */
  .properties-toggle {
    position: absolute;
    top: 12px;
    left: -12px;
    z-index: 5;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    border: 1px solid var(--border-light);
    background: var(--bg-secondary);
    box-shadow: var(--shadow-sm);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background var(--transition-fast),
                box-shadow var(--transition-fast),
                transform var(--transition-fast);

    &:hover {
      background: var(--bg-tertiary);
      box-shadow: var(--shadow-md);
      transform: scale(1.05);
    }

    &:focus-visible {
      outline: 2px solid var(--color-primary);
      outline-offset: 1px;
    }
  }

  .chevron {
    width: 0;
    height: 0;
    border-top: 4px solid transparent;
    border-bottom: 4px solid transparent;
    border-left: 5px solid var(--text-secondary);
    transition: transform 0.18s cubic-bezier(0.4, 0, 0.2, 1),
                border-left-color var(--transition-fast);

    &.collapsed {
      /* 折叠态：箭头反向，暗示"点击展开" */
      transform: rotate(180deg);
    }
  }

  .properties-toggle:hover .chevron {
    border-left-color: var(--color-primary);
  }

  /*
   * 折叠态下不显示"属性"两字 —— 仅靠圆形 toggle 按钮 + hover tooltip（"展开属性面板"）
   * 提示用户回到这里。窄边只留 36px 是为了 toggle 按钮本身能放下。
   */
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