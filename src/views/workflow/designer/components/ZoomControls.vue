<script setup lang="ts">
/**
 * 设计器缩放控件：放大 / 缩小 / 缩放到合适 / 重置。
 *
 * 用法：
 *   <ZoomControls :modeler="modelerInstance" />
 *   其中 modeler 必须能 get('zoomScroll') / get('canvas')
 */

import { onBeforeUnmount } from 'vue'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const props = defineProps<{ modeler: any }>()

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getZoom(): any {
  if (!props.modeler) return null
  return props.modeler.get('zoomScroll') ?? null
}

function getCanvas() {
  if (!props.modeler) return null
  return props.modeler.get('canvas') ?? null
}

function zoomIn() {
  const z = getZoom()
  if (z && typeof z.stepZoom === 'function') z.stepZoom(1)
}

function zoomOut() {
  const z = getZoom()
  if (z && typeof z.stepZoom === 'function') z.stepZoom(-1)
}

function zoomFit() {
  const c = getCanvas()
  if (c && typeof c.zoom === 'function') c.zoom('fit-viewport')
}

function zoomReset() {
  const c = getCanvas()
  if (c && typeof c.zoom === 'function') c.zoom(1, { x: 0, y: 0 })
}

onBeforeUnmount(() => {
  /* 不持有资源 */
})
</script>

<template>
  <div class="zoom-controls">
    <button
      class="zoom-btn"
      title="放大（Ctrl + +）"
      aria-label="放大"
      @click="zoomIn"
    >
      <span class="icon">+</span>
    </button>
    <button
      class="zoom-btn"
      title="缩小（Ctrl + -）"
      aria-label="缩小"
      @click="zoomOut"
    >
      <span class="icon">−</span>
    </button>
    <button
      class="zoom-btn"
      title="缩放到合适"
      aria-label="缩放到合适"
      @click="zoomFit"
    >
      <span class="icon fit">⤢</span>
    </button>
    <button
      class="zoom-btn"
      title="重置（100%）"
      aria-label="重置"
      @click="zoomReset"
    >
      <span class="icon reset">100</span>
    </button>
  </div>
</template>

<style scoped lang="scss">
.zoom-controls {
  position: absolute;
  bottom: var(--space-md);
  right: var(--space-md);
  display: flex;
  flex-direction: column;
  gap: 4px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  z-index: 5;
}

.zoom-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  color: var(--text-secondary);
  transition: all var(--transition-base);

  &:hover {
    background: var(--bg-tertiary);
    color: var(--color-primary);
  }

  &:active {
    background: rgba(var(--color-primary-rgb), 0.12);
  }

  .icon {
    font-size: 16px;
    line-height: 1;
    font-weight: 600;
  }

  .icon.reset {
    font-size: 11px;
  }

  .icon.fit {
    font-size: 14px;
  }
}
</style>