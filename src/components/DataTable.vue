<script setup lang="ts" generic="T extends Record<string, unknown>">
import { computed } from 'vue'

/** 列定义：key / title / width / align / ellipsis / sticky */
export interface DataTableColumn {
  key: string
  title: string
  width: string
  align?: 'left' | 'center' | 'right'
  /** 固定在右侧（横向滚动时钉住）；默认 key === 'action' 自动启用 */
  sticky?: boolean
}

interface Props {
  columns: DataTableColumn[]
  data: T[]
  loading?: boolean
  rowKey?: keyof T | ((row: T) => string | number)
  emptyText?: string
  /** 总条数；传入则渲染分页 */
  total?: number
  pageSize?: number
  current?: number
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

const emit = defineEmits<{
  (e: 'page-change', page: number): void
  (e: 'page-size-change', size: number): void
}>()

function getRowKey(row: T): string | number {
  if (typeof props.rowKey === 'function') return props.rowKey(row)
  return row[props.rowKey] as string | number
}

const totalPages = computed(() => Math.max(1, Math.ceil((props.total ?? 0) / props.pageSize)))
const showPagination = computed(() => props.total !== undefined)

/** 是否固定列：sticky 显式指定优先；未指定时 key === 'action' 自动启用 */
function isStickyCol(col: DataTableColumn): boolean {
  return col.sticky ?? col.key === 'action'
}
</script>

<template>
  <div class="data-table-wrapper">
    <div class="data-table-container">
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
      <div class="pagination-info">共 {{ total }} 条</div>
      <div class="pagination-controls">
        <select
          :value="pageSize"
          class="page-size-select"
          @change="emit('page-size-change', Number(($event.target as HTMLSelectElement).value))"
        >
          <option v-for="size in pageSizeOptions" :key="size" :value="size">{{ size }} 条/页</option>
        </select>
        <button :disabled="current <= 1" @click="emit('page-change', current - 1)">上一页</button>
        <button :disabled="current >= totalPages" @click="emit('page-change', current + 1)">下一页</button>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
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
    background: var(--bg-secondary);
    // 左侧投影暗示"这一列在浮动"
    box-shadow: -1px 0 0 var(--border-light);
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