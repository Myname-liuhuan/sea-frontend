<script setup lang="ts">
/**
 * BPMN 缩略图容器：
 *
 * 1. 提供一个视觉化的 toggle 入口（Vue 这边的 .minimap-host 容器）。
 *    闭态：显示"缩略图 ▾ / 展开"提示框；点击展开 minimap。
 *    开态：显示缩略图 + 关闭按钮（×）；点击关闭。
 *
 * 2. diagram-js-minimap 内部仍会自己往 canvas 容器里 inject 一个 .djs-minimap
 *    元素。CSS 里通过 `.djs-minimap:not(.open) .toggle { display:none }` 隐藏
 *    它自带的 toggle，避免重复入口。
 */
import { onBeforeUnmount, onMounted, ref } from 'vue'

const expanded = ref(false)

function toggle(): void {
  expanded.value = !expanded.value
  applyToMinimap()
}

function applyToMinimap(): void {
  const minimap = document.querySelector('.djs-minimap')
  if (!minimap) return
  if (expanded.value) {
    minimap.classList.add('open')
    minimap.dispatchEvent(new MouseEvent('click', { bubbles: true })) // 部分实现靠 toggle.click()
  } else {
    minimap.classList.remove('open')
  }
}

/** 延时多久后开始观察 minimap DOM（等社区包注入完成） */
const OBSERVER_DEBOUNCE_MS = 100

/**
 * 监听 minimap 自己 toggle（用户通过 toggle 区域 toggle 也能同步状态）。
 * 用 unknown 类型装 MutationObserver 实例，避开 ESLint no-undef 和 TS 接口不对齐的问题。
 */
// eslint-disable-next-line no-undef
let observer: MutationObserver | null = null
onMounted(() => {
  // 等下一帧 minimap DOM 已注入
  setTimeout(() => {
    const minimap = document.querySelector('.djs-minimap')
    if (!minimap) return
    // eslint-disable-next-line no-undef
    observer = new MutationObserver(() => {
      expanded.value = minimap.classList.contains('open')
    })
    observer.observe(minimap, { attributes: true, attributeFilter: ['class'] })
  }, OBSERVER_DEBOUNCE_MS)
})

onBeforeUnmount(() => {
  observer?.disconnect()
})
</script>

<template>
  <div
    class="minimap-host"
    :class="{ expanded }"
    role="region"
    aria-label="流程缩略图"
  >
    <button
      class="minimap-toggle"
      :aria-label="expanded ? '收起缩略图' : '展开缩略图'"
      :title="expanded ? '收起缩略图' : '展开缩略图'"
      @click.stop="toggle"
    >
      <svg
        v-if="!expanded"
        width="14"
        height="14"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        stroke-width="1.4"
      >
        <rect x="2" y="2" width="12" height="12" rx="1.5" />
        <rect x="9" y="9" width="4" height="4" />
      </svg>
      <svg
        v-else
        width="12"
        height="12"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        stroke-width="1.6"
      >
        <path d="M4 4 L12 12 M12 4 L4 12" />
      </svg>
      <span class="label">{{ expanded ? '收起' : '缩略图' }}</span>
    </button>
  </div>
</template>

<style scoped lang="scss">
.minimap-host {
  position: absolute;
  bottom: var(--space-md);
  left: var(--space-md);
  z-index: 5;

  /*
   * 闭态：紧凑的"缩略图"标签按钮 —— 一个 SVG 图标 + 文字。
   * 不再像社区包默认那样占 150x40 大块挡画布。
   */
  .minimap-toggle {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 10px;
    background: var(--bg-secondary);
    border: 1px solid var(--border-light);
    border-radius: var(--radius-md);
    cursor: pointer;
    box-shadow: var(--shadow-sm);
    color: var(--text-secondary);
    font-size: 12px;
    transition: all var(--transition-fast);

    &:hover {
      background: var(--bg-tertiary);
      color: var(--color-primary);
      box-shadow: var(--shadow-md);
    }

    &:focus-visible {
      outline: 2px solid var(--color-primary);
      outline-offset: 1px;
    }

    .label {
      letter-spacing: 0.3px;
    }
  }

  /*
   * 开态：把 minimap 浮起来一点，加边框阴影。
   * 真正缩略图内容是 diagram-js-minimap 自己 inject 到 canvas 里的 .djs-minimap，
   * 我们这里只做容器装饰。
   */
  &.expanded {
    /* 提示条隐藏，让出空间给真正的 minimap */
    .minimap-toggle {
      display: none;
    }
  }
}

/*
 * 隐藏社区包 diagram-js-minimap 自带的 toggle 按钮。
 *
 * 这个 toggle 默认会出现在画布中部（150x40 灰色块），挡住 BPMN 图。
 * 不管 minimap 是开是关，我们都用自己的 Vue 按钮（minimap-toggle）管理，
 * 所以这里始终隐藏社区版的 toggle。
 */
:global(.djs-minimap .toggle) {
  display: none !important;
}

/*
 * 重新定位 minimap 本身 —— 社区包默认 top:20px right:20px，在大画布里
 * 会停在中间；我们改成 bottom:50px left:50px，更贴近我们自己的 Vue 按钮位置，
 * 形成"右下角缩略图 + 左下角 toggle"的视觉组。
 *
 * 真正显示 minimap 的时候 —— 只在 .open 状态下：
 */
:global(.djs-minimap.open) {
  top: auto !important;
  right: var(--space-md) !important;
  bottom: var(--space-md) !important;
  left: auto !important;
  border: 1px solid var(--border-light) !important;
  border-radius: var(--radius-md) !important;
  box-shadow: var(--shadow-md) !important;
  background: var(--bg-secondary) !important;
  z-index: 6 !important;
}
</style>