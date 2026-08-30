<script setup lang="ts" generic="T extends Record<string, unknown>">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

/** 列定义：key / title / width / align / ellipsis / sticky */
export interface DataTableColumn {
  key: string
  title: string
  width: string
  align?: 'left' | 'center' | 'right'
  /** 单行省略 */
  ellipsis?: boolean
  /** 固定在右侧（横向滚动时钉住）；默认 key === 'action' 自动启用 */
  sticky?: boolean
}

interface Props {
  columns: DataTableColumn[]
  data: T[]
  loading?: boolean
  rowKey?: keyof T | ((row: T) => string | number)
  emptyText?: string
  /** 总条数；传入则渲染分页。后端 Long 序列化为字符串时也能兼容 */
  total?: number | string
  pageSize?: number | string
  current?: number | string
  pageSizeOptions?: number[]
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  emptyText: '暂无数据',
  total: undefined,
  pageSize: 10,
  current: 1,
  pageSizeOptions: () => [10, 20, 50], // eslint-disable-line no-magic-numbers
  rowKey: () => 'id' as keyof T,
})

// 后端 Long 全局序列化为字符串（防 Snowflake ID 精度丢失），
// 这里统一转回 number 给分页计算用。
const FALLBACK_PAGE_SIZE = 10
const totalNumber = computed(() => Number(props.total ?? 0))
const pageSizeNumber = computed(() => Number(props.pageSize) || FALLBACK_PAGE_SIZE)
const currentNumber = computed(() => Number(props.current) || 1)

const emit = defineEmits<{
  (e: 'page-change', page: number): void
  (e: 'page-size-change', size: number): void
}>()

function getRowKey(row: T): string | number {
  if (typeof props.rowKey === 'function') return props.rowKey(row)
  return row[props.rowKey] as string | number
}

const totalPages = computed(() => Math.max(1, Math.ceil(totalNumber.value / pageSizeNumber.value)))
const showPagination = computed(() => props.total !== undefined)

/** 是否固定列：sticky 显式指定优先；未指定时 key === 'action' 自动启用 */
function isStickyCol(col: DataTableColumn): boolean {
  return col.sticky ?? col.key === 'action'
}

// ========== 横向溢出感知 ==========
// 列宽总和 > 容器宽度时容器出现横向滚动条，操作列 sticky 悬浮在右边缘。
// 用户第一眼会以为"创建时间列被覆盖"，所以加：
//   1. 静态视觉强化（阴影 + 加深背景），让"悬浮"在静态时也可读
//   2. 滚动联动：右侧渐变遮罩在"还能往右滚"时才出现，滚到底淡出
const containerRef = ref<HTMLElement | null>(null)
const canScrollRight = ref(false)

function updateOverflowState(): void {
  const el = containerRef.value
  if (!el) return
  // scrollLeft + clientWidth < scrollWidth - 1 表示还有可滚动空间
  // 用 1px 容差避免亚像素抖动让 class 反复 toggle
  canScrollRight.value =
    el.scrollLeft + el.clientWidth < el.scrollWidth - 1
}

let resizeObserver: ResizeObserver | null = null
onMounted(() => {
  const el = containerRef.value
  if (!el) return
  el.addEventListener('scroll', updateOverflowState, { passive: true })
  // 内容/容器尺寸变化时重新计算（例如响应式折叠菜单导致容器宽度变化）
  resizeObserver = new ResizeObserver(updateOverflowState)
  resizeObserver.observe(el)
  // 立即跑一次，否则首屏不会出现遮罩
  updateOverflowState()
})
onBeforeUnmount(() => {
  containerRef.value?.removeEventListener('scroll', updateOverflowState)
  resizeObserver?.disconnect()
  resizeObserver = null
})
</script>

<template>
  <div
    class="data-table-wrapper"
    :class="{ 'has-overflow-right': canScrollRight }"
  >
    <div ref="containerRef" class="data-table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th
              v-for="col in columns"
              :key="col.key"
              :class="{ 'col-sticky': isStickyCol(col) }"
              :style="{ width: col.width, textAlign: col.align ?? (col.key === 'action' ? 'center' : 'left') }"
            >
              {{ col.title }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading">
            <td :colspan="columns.length" class="state-cell">
              <div class="loading-text">加载中...</div>
            </td>
          </tr>
          <tr v-else-if="!data.length">
            <td :colspan="columns.length" class="state-cell">
              <div class="empty-state">{{ emptyText }}</div>
            </td>
          </tr>
          <tr v-for="row in data" v-else :key="getRowKey(row)">
            <td
              v-for="col in columns"
              :key="col.key"
              :class="{ 'col-sticky': isStickyCol(col) }"
              :style="{ textAlign: col.align ?? 'left' }"
            >
              <slot :name="`cell-${col.key}`" :row="row">
                {{ row[col.key] ?? '-' }}
              </slot>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="showPagination" class="data-table-pagination">
      <div class="pagination-info">共 {{ totalNumber }} 条</div>
      <div class="pagination-controls">
        <select
          :value="pageSizeNumber"
          class="page-size-select"
          @change="emit('page-size-change', Number(($event.target as HTMLSelectElement).value))"
        >
          <option v-for="size in pageSizeOptions" :key="size" :value="size">{{ size }} 条/页</option>
        </select>
        <button :disabled="currentNumber <= 1" @click="emit('page-change', currentNumber - 1)">上一页</button>
        <button :disabled="currentNumber >= totalPages" @click="emit('page-change', currentNumber + 1)">下一页</button>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.data-table-wrapper {
  position: relative; // 渐变遮罩的锚点（必须放在 wrapper，不能放 container —— container overflow-x:auto 会裁掉 absolute 子元素）
  &.has-overflow-right::after {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    width: 24px;
    pointer-events: none;
    // 渐变从二级背景过渡到透明，暗示"列在后面被遮住了"
    // 圆角和 container 一致，避免在右上角露出底色
    border-top-right-radius: var(--radius-lg);
    border-bottom-right-radius: var(--radius-lg);
    background: linear-gradient(
      to left,
      var(--bg-secondary),
      transparent
    );
  }
}

.data-table-container {
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-light);
  // 列宽总和可能超过容器 → 横向滚动兜底，避免操作列被裁掉
  overflow-x: auto;
}

.data-table {
  width: 100%;
  table-layout: fixed;
  border-collapse: collapse;
  font-size: 13px;

  thead {
    background: var(--bg-primary);
    th {
      padding: 14px 16px;
      font-weight: 600;
      color: var(--text-secondary);
      border-bottom: 1px solid var(--border-light);
    }
  }

  tbody tr {
    &:hover { background: var(--bg-primary); }
    td {
      padding: 14px 16px;
      border-bottom: 1px solid var(--border-light);
    }
    // 文本列才允许省略；最后一列（通常是操作列）保持原样
    td:not(:last-child) {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  // 固定列：横向滚动时钉在容器右侧
  .col-sticky {
    position: sticky;
    right: 0;
    z-index: 1;
    // 加深背景，与左侧数据列形成色差，静态时也能看出"这列是浮起来的"
    background: var(--bg-secondary);
    // 硬分割线把"悬浮列"和"滚动列"在视觉上切开
    box-shadow: -1px 0 0 var(--border-color);
  }
  thead .col-sticky {
    background: var(--bg-primary);
    z-index: 2; // 表头要压在 td 之上
  }
  tbody tr:hover .col-sticky {
    background: var(--bg-primary);
  }
}

.state-cell {
  text-align: center;
  padding: 48px 16px;
  color: var(--text-tertiary);
  font-size: 13px;
}

.data-table-pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-md) 0;
}

.pagination-info {
  font-size: 13px;
  color: var(--text-secondary);
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: var(--space-sm);

  button {
    height: 32px;
    padding: 0 12px;
    font-size: 13px;
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-sm);
    cursor: pointer;
    &:hover:not(:disabled) { background: var(--bg-primary); }
    &:disabled { opacity: 0.5; cursor: not-allowed; }
  }
}

.page-size-select {
  height: 32px;
  padding: 0 8px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  font-size: 13px;
}
</style>