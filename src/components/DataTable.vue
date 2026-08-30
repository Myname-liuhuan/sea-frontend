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

// table-layout: fixed 下浏览器会把 width: 'auto' 列压成 0px
// （固定列总和 > 容器宽度时 auto 列是第一个被牺牲的）。
// 兜底成 150px：足够容纳 4 个中文字符 + ellipsis，视觉上仍能看出"有内容"。
// 列定义里保留 'auto' 语义（表达"自适应"），组件层统一替换。
const AUTO_COLUMN_FALLBACK_WIDTH = '150px'

function effectiveWidth(col: DataTableColumn): string {
  return col.width === 'auto' ? AUTO_COLUMN_FALLBACK_WIDTH : col.width
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
              :style="{ width: effectiveWidth(col), textAlign: col.align ?? (col.key === 'action' ? 'center' : 'left') }"
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
// ========== 设计 token 分配 ==========
// 原则：视觉差异只在差异真实存在时才有意义。
// 操作列「浮起感」（背景色 + 投影）和右侧渐变遮罩受同一套 .has-overflow-right 门控：
// 无溢出 → 操作列与其他列视觉一致（看起来就是一张完整的表）
// 有溢出 → 操作列显出深度（bg-tertiary + shadow）信号「我被钉住」
//
// ① 表头：           --bg-primary    #fafafa
// ② 数据行：         --bg-secondary #ffffff
// ③ hover 行：       --bg-tertiary   #f5f5f5（与「操作列浮起色」同档 → hover 行整体一致）
// ④ tbody 浮列（有溢出）：  --bg-tertiary   #f5f5f5
// ⑤ thead 浮列（有溢出）：  --bg-primary    #fafafa（与表头其余列同色，仅靠 1px 内边线标识）

.data-table-wrapper {
  position: relative; // 渐变遮罩的锚点（不能放 container —— overflow-x:auto 会裁掉 absolute 子元素）

  // 渐变遮罩：右侧 32px 渐变 + 1px 内侧高光
  // 起点用 bg-tertiary 与白色容器形成 6% 灰度差
  &.has-overflow-right::after {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    width: 32px;
    pointer-events: none;
    border-top-right-radius: var(--radius-lg);
    border-bottom-right-radius: var(--radius-lg);
    background: linear-gradient(
      to left,
      var(--bg-tertiary),
      rgba(245, 245, 245, 0)
    );
    // 内侧 1px 高光：模拟"光的切割面"，让渐变边缘更立体
    box-shadow: inset 1px 0 0 var(--border-light);
  }

  // :has() 联动：tbody 有行被 hover 时，渐变起点同步到 hover 行的 tertiary 色，
  // 让遮罩在视觉上和 hover 行"连成一片"，避免遮罩盖在 hover 行上产生撕裂
  &:has(tbody tr:hover).has-overflow-right::after {
    background: linear-gradient(
      to left,
      var(--bg-secondary),
      rgba(255, 255, 255, 0)
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

  // ① 表头：浅灰底 + 加深下边框 + 字距让"中文方块"不挤
  thead {
    background: var(--bg-primary);
    th {
      padding: 14px 16px;
      font-weight: 600;
      color: var(--text-primary);
      border-bottom: 1px solid var(--border-color); // 比 border-light 略深
      letter-spacing: 0.02em;
    }
  }

  // ② ③ 数据行 & hover
  // hover 行整体变 tertiary（6% 灰度差，比 primary 的 4% 更明显）
  // 操作列保持自身颜色不变 —— 操作列本来就比数据列深，不需要再随 hover 变
  tbody tr {
    td {
      padding: 14px 16px;
      border-bottom: 1px solid var(--border-light);
      transition: background-color 80ms linear; // 平滑过渡，工具感而不飘
    }
    &:hover td { background: var(--bg-tertiary); }
    // 文本列才允许省略；最后一列（通常是操作列）保持原样
    td:not(:last-child) {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  // ④ ⑤ 悬浮列（操作列）—— 视觉强化受 .has-overflow-right 门控
  // 无溢出时只保留功能性 position: sticky，视觉上与其他列完全一致
  .col-sticky {
    position: sticky;
    right: 0;
  }
}

// .has-overflow-right 在外层 wrapper 上，必须从 wrapper 向下选，不能嵌套在 .data-table 里
// （否则 SCSS 展开成 .data-table .has-overflow-right .col-sticky，要求 has-overflow-right
// 是 .data-table 的后代，但实际它在 .data-table 的祖先 wrapper 上 → 匹配不上）
.data-table-wrapper.has-overflow-right .data-table {
  .col-sticky {
    z-index: 1;
    // tbody 浮列 tertiary，浮起感来自"和数据列的色差"
    background: var(--bg-tertiary);
    // 立体"侧翼"：内 1px 亮边 + 外 软投影
    box-shadow:
      inset 1px 0 0 var(--border-light),
      -2px 0 8px -2px rgba(0, 0, 0, 0.06);
  }
  thead .col-sticky {
    // thead 用 primary —— 与表头其余列同色，仅靠 1px 边线标识"我是浮列"
    background: var(--bg-primary);
    z-index: 2; // 表头压在 td 之上
    // 去掉外投影（表头不需要"浮"），保留内亮边
    box-shadow: inset 1px 0 0 var(--border-light);
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