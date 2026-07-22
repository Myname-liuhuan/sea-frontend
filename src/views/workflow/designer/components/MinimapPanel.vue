<script setup lang="ts">
/**
 * BPMN 缩略图容器：diagram-js-minimap 默认会自己挂到第一个匹配 .djs-minimap 的容器。
 *
 * 用法：
 *   在 additionalModules 装上 minimap，然后在画布外侧放一个 div.minimap-host，
 *   minimap 会自动定位到它。
 */
</script>

<template>
  <div class="minimap-host" aria-label="流程缩略图">
    <div class="djs-minimap-mount"></div>
  </div>
</template>

<style scoped lang="scss">
.minimap-host {
  position: absolute;
  bottom: var(--space-md);
  left: var(--space-md);
  width: 200px;
  height: 140px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  overflow: hidden;
  z-index: 5;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);

  /* diagram-js-minimap 会在挂载点创建 .minimap 元素 */
  :deep(.minimap) {
    width: 100%;
    height: 100%;
  }
}

.djs-minimap-mount {
  width: 100%;
  height: 100%;
}
</style>