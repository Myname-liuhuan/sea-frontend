<script setup lang="ts">
/**
 * XML 行级 diff 视图：左边 baseline（当前 XML），右边 target（历史版本），
 * 中间按行高亮 add / remove / equal。
 *
 * 算法：自实现的 LCS（Longest Common Subsequence）按行做 diff，
 * 不引入 diff 库——XML 文件通常 < 100 KB，行数 O(几百)，LCS 完全够用。
 *
 * 用法：
 *   <DiffView
 *     :baseline="currentXml"
 *     :target="historyXml"
 *     :baseline-label="当前 v3"
 *     :target-label="历史 v1"
 *     @close="..."
 *   />
 */

import { computed } from 'vue'

const props = defineProps<{
  baseline: string
  target: string
  baselineLabel?: string
  targetLabel?: string
}>()

defineEmits<{
  (e: 'close'): void
}>()

type DiffRow =
  | { type: 'equal'; left: string; right: string; lineNo: number }
  | { type: 'add'; right: string; rightLineNo: number }
  | { type: 'remove'; left: string; leftLineNo: number }
  | { type: 'change'; left: string; right: string; leftLineNo: number; rightLineNo: number }

/** remove + add 一对合并为 change 行的步长 */
const MERGE_PAIR_STEP = 2

const rows = computed<DiffRow[]>(() => {
  const a = props.baseline.split(/\r?\n/)
  const b = props.target.split(/\r?\n/)
  const lcs = computeLcs(a, b)
  return buildDiff(a, b, lcs)
})

const stats = computed(() => {
  let add = 0, remove = 0, change = 0
  for (const r of rows.value) {
    if (r.type === 'add') add++
    else if (r.type === 'remove') remove++
    else if (r.type === 'change') change++
  }
  return { add, remove, change }
})

/**
 * LCS 经典 DP：lcs[i][j] = a[0..i) 与 b[0..j) 的最长公共子序列长度
 */
function computeLcs(a: string[], b: string[]): number[][] {
  const m = a.length
  const n = b.length
  const lcs: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0))
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        lcs[i][j] = lcs[i - 1][j - 1] + 1
      } else {
        lcs[i][j] = Math.max(lcs[i - 1][j], lcs[i][j - 1])
      }
    }
  }
  return lcs
}

/**
 * 回溯生成 diff 行：equal / add / remove / change（"change"是连续 remove+add）
 */
function buildDiff(a: string[], b: string[], lcs: number[][]): DiffRow[] {
  const result: DiffRow[] = []
  let i = a.length
  let j = b.length
  let leftLineNo = a.length
  let rightLineNo = b.length

  // 先逆序生成，再反转
  while (i > 0 && j > 0) {
    if (a[i - 1] === b[j - 1]) {
      result.push({ type: 'equal', left: a[i - 1], right: b[j - 1], lineNo: leftLineNo })
      i--
      j--
      leftLineNo--
      rightLineNo--
    } else if (lcs[i - 1][j] >= lcs[i][j - 1]) {
      result.push({ type: 'remove', left: a[i - 1], leftLineNo })
      i--
      leftLineNo--
    } else {
      result.push({ type: 'add', right: b[j - 1], rightLineNo })
      j--
      rightLineNo--
    }
  }
  while (i > 0) {
    result.push({ type: 'remove', left: a[i - 1], leftLineNo })
    i--
    leftLineNo--
  }
  while (j > 0) {
    result.push({ type: 'add', right: b[j - 1], rightLineNo })
    j--
    rightLineNo--
  }

  const reversed = result.reverse()

  // 把相邻的 remove + add 合并为 change 行
  return mergeRemoveAdd(reversed)
}

/** 把 remove + add 相邻的两行合并成 change 行，让 diff 更紧凑 */
function mergeRemoveAdd(reversed: DiffRow[]): DiffRow[] {
  const merged: DiffRow[] = []
  let k = 0
  while (k < reversed.length) {
    const cur = reversed[k]
    const next = reversed[k + 1]
    if (cur.type === 'remove' && next?.type === 'add') {
      merged.push({
        type: 'change',
        left: cur.left,
        right: next.right,
        leftLineNo: cur.leftLineNo,
        rightLineNo: next.rightLineNo,
      })
      k += MERGE_PAIR_STEP
    } else {
      merged.push(cur)
      k += 1
    }
  }
  return merged
}
</script>

<template>
  <div class="diff-overlay" @click.self="$emit('close')">
    <div class="diff-modal">
      <div class="diff-header">
        <span class="title">版本对比</span>
        <span class="stats">
          <span class="stat add">+{{ stats.add }}</span>
          <span class="stat remove">-{{ stats.remove }}</span>
          <span class="stat change">±{{ stats.change }}</span>
        </span>
        <button class="close-btn" @click="$emit('close')">关闭</button>
      </div>
      <div class="diff-labels">
        <div class="label">{{ baselineLabel ?? 'Baseline' }}</div>
        <div class="label">{{ targetLabel ?? 'Target' }}</div>
      </div>
      <div class="diff-body">
        <table class="diff-table">
          <tbody>
            <tr v-for="(row, idx) in rows" :key="idx" :class="row.type">
              <td class="ln left">
                <span v-if="'leftLineNo' in row">{{ row.leftLineNo }}</span>
              </td>
              <td class="content left">
                <pre>{{ 'left' in row ? row.left : '' }}</pre>
              </td>
              <td class="ln right">
                <span v-if="'rightLineNo' in row">{{ row.rightLineNo }}</span>
              </td>
              <td class="content right">
                <pre>{{ 'right' in row ? row.right : '' }}</pre>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.diff-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.diff-modal {
  background: var(--bg-primary);
  border-radius: var(--radius-lg);
  width: 90vw;
  max-width: 1400px;
  height: 85vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.diff-header {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-md) var(--space-lg);
  border-bottom: 1px solid var(--border-light);
  background: var(--bg-secondary);

  .title {
    font-size: 14px;
    font-weight: 600;
  }

  .stats {
    display: flex;
    gap: var(--space-sm);
    font-family: var(--font-mono);
    font-size: 12px;

    .stat {
      padding: 2px 8px;
      border-radius: 4px;
      font-weight: 600;
    }
    .stat.add { background: rgba(var(--color-success-rgb), 0.12); color: var(--color-success); }
    .stat.remove { background: rgba(var(--color-danger-rgb), 0.12); color: var(--color-danger); }
    .stat.change { background: rgba(var(--color-warning-rgb), 0.12); color: var(--color-warning); }
  }

  .close-btn {
    margin-left: auto;
    background: transparent;
    border: 1px solid var(--border-color);
    border-radius: var(--radius-sm);
    padding: 4px 12px;
    cursor: pointer;
    color: var(--text-secondary);
    &:hover { color: var(--color-primary); border-color: var(--color-primary); }
  }
}

.diff-labels {
  display: grid;
  grid-template-columns: 1fr 1fr;
  background: var(--bg-tertiary);
  border-bottom: 1px solid var(--border-light);
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);

  .label {
    padding: 6px var(--space-md);
    &:last-child {
      border-left: 1px solid var(--border-light);
    }
  }
}

.diff-body {
  flex: 1;
  overflow: auto;
  background: var(--bg-primary);
}

.diff-table {
  width: 100%;
  border-collapse: collapse;
  font-family: var(--font-mono);
  font-size: 12px;
  line-height: 1.6;

  td {
    padding: 0;
    vertical-align: top;
  }

  .ln {
    width: 50px;
    text-align: right;
    padding: 0 8px;
    color: var(--text-tertiary);
    user-select: none;
    border-right: 1px solid var(--border-light);
    background: var(--bg-secondary);
  }

  .content {
    width: 50%;
    border-right: 1px solid var(--border-light);

    pre {
      margin: 0;
      padding: 0 var(--space-md);
      white-space: pre-wrap;
      word-break: break-all;
      color: var(--text-primary);
    }

    &.right {
      border-right: none;
      border-left: 1px solid var(--border-light);
    }
  }

  tr.add {
    .content.right { background: rgba(var(--color-success-rgb), 0.1); }
  }
  tr.remove {
    .content.left { background: rgba(var(--color-danger-rgb), 0.1); }
  }
  tr.change {
    .content.left { background: rgba(var(--color-warning-rgb), 0.08); }
    .content.right { background: rgba(var(--color-warning-rgb), 0.08); }
  }
}
</style>