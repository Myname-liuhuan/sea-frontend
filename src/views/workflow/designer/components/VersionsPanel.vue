<script setup lang="ts">
/**
 * 版本历史面板：列出模型的所有历史版本，支持查看 diff、回滚到指定版本。
 *
 * 用法：
 *   <VersionsPanel
 *     :model-id="modelId"
 *     :current-xml="currentBpmnXml"
 *     @diff="onShowDiff"
 *   />
 *
 * - 点行 → 触发 diff 事件，传入 { version, xml } 由父组件渲染 DiffView
 * - 点"回滚" → 二次确认后调接口，写回现行模型 + 新增一条 history
 */

import { onMounted, ref } from 'vue'
import { Message, Modal } from '@arco-design/web-vue'
import {
  getModelVersionBpmn,
  listModelVersions,
  rollbackModelToVersion,
} from '@/api/workflow/model'
import { RESPONSE_CODE } from '@/constants'
import { WORKFLOW_MODEL_PERMS } from '@/constants/workflow'
import type { WorkflowModelVersion } from '@/types/workflow'

/** 时间字符串裁剪长度："yyyy-MM-ddTHH:mm:ss" → "yyyy-MM-dd HH:mm:ss" */
const DATE_TIME_LENGTH = 19

const props = defineProps<{
  modelId: string | null
  currentXml: string
}>()

const emit = defineEmits<{
  (e: 'diff', payload: { version: number; xml: string }): void
  (e: 'rolledBack'): void
}>()

const loading = ref(false)
const versions = ref<WorkflowModelVersion[]>([])
const expanded = ref(true)

async function loadList(): Promise<void> {
  if (!props.modelId) return
  loading.value = true
  try {
    const res = await listModelVersions(props.modelId)
    if (res.code === RESPONSE_CODE.SUCCESS && res.data) {
      versions.value = res.data
    } else {
      Message.error(res.message || '加载版本失败')
    }
  } finally {
    loading.value = false
  }
}

async function onViewDiff(row: WorkflowModelVersion): Promise<void> {
  const res = await getModelVersionBpmn(props.modelId ?? '', row.version)
  if (res.code !== RESPONSE_CODE.SUCCESS || !res.data) {
    Message.error(res.message || '取版本 XML 失败')
    return
  }
  emit('diff', { version: row.version, xml: res.data })
}

function onRollback(row: WorkflowModelVersion): void {
  Modal.warning({
    title: '回滚到该版本',
    content: `将回滚模型到 v${row.version}。当前未保存的修改会丢失（如果还没保存，会被一并覆盖），并写入一条新的历史快照。`,
    okText: '确认回滚',
    cancelText: '取消',
    async onOk() {
      if (!props.modelId) return
      const res = await rollbackModelToVersion(
        props.modelId,
        row.version,
        `从 v${row.version} 回滚`,
      )
      if (res.code === RESPONSE_CODE.SUCCESS) {
        Message.success(`已回滚到 v${row.version}，新增历史 v${res.data}`)
        emit('rolledBack')
        await loadList()
      } else {
        Message.error(res.message || '回滚失败')
      }
    },
  })
}

const formatted = (s?: string): string =>
  s ? s.replace('T', ' ').slice(0, DATE_TIME_LENGTH) : '—'

onMounted(loadList)

defineExpose({ loadList })
</script>

<template>
  <div v-if="modelId" class="versions-panel" :class="{ collapsed: !expanded }">
    <div class="panel-header" @click="expanded = !expanded">
      <span class="title">版本历史</span>
      <span class="count">{{ versions.length }}</span>
      <button
        v-if="expanded"
        v-has-permi="WORKFLOW_MODEL_PERMS.WRITE"
        class="refresh-btn"
        :disabled="loading"
        @click.stop="loadList"
      >
        刷新
      </button>
    </div>
    <ul v-if="expanded" class="version-list">
      <li v-if="loading" class="empty">加载中…</li>
      <li v-else-if="versions.length === 0" class="empty">暂无历史</li>
      <li
        v-for="row in versions"
        :key="row.id"
        class="version-item"
        :class="{ latest: row.latest }"
      >
        <div class="row-main">
          <span class="version-tag">v{{ row.version }}</span>
          <span v-if="row.latest" class="latest-tag">最新</span>
          <span class="creator">{{ row.creatorName ?? '—' }}</span>
          <span class="time">{{ formatted(row.createTime) }}</span>
        </div>
        <div v-if="row.changeComment" class="comment">{{ row.changeComment }}</div>
        <div class="row-actions">
          <button
            v-has-permi="WORKFLOW_MODEL_PERMS.READ"
            class="mini-btn"
            @click="onViewDiff(row)"
          >
            对比
          </button>
          <button
            v-has-permi="WORKFLOW_MODEL_PERMS.WRITE"
            class="mini-btn danger"
            @click="onRollback(row)"
          >
            回滚
          </button>
        </div>
      </li>
    </ul>
  </div>
</template>

<style scoped lang="scss">
.versions-panel {
  border-top: 1px solid var(--border-light);
  background: var(--bg-secondary);
  flex-shrink: 0;
  max-height: 260px;
  display: flex;
  flex-direction: column;

  &.collapsed {
    max-height: 36px;
  }
}

.panel-header {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: 6px var(--space-md);
  background: var(--bg-tertiary);
  border-bottom: 1px solid var(--border-light);
  cursor: pointer;
  user-select: none;

  .title {
    font-size: 13px;
    font-weight: 600;
    color: var(--text-primary);
  }

  .count {
    font-size: 12px;
    color: var(--text-tertiary);
  }

  .refresh-btn {
    margin-left: auto;
    background: transparent;
    border: 1px solid var(--border-color);
    border-radius: var(--radius-sm);
    padding: 2px 10px;
    font-size: 11px;
    cursor: pointer;
    color: var(--text-secondary);
    &:hover:not(:disabled) {
      background: var(--bg-secondary);
      color: var(--color-primary);
    }
    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }
}

.version-list {
  list-style: none;
  margin: 0;
  padding: 0;
  overflow-y: auto;
  flex: 1;
}

.version-item {
  padding: 8px var(--space-md);
  border-bottom: 1px solid var(--border-light);
  font-size: 12px;

  &.latest {
    background: rgba(var(--color-primary-rgb), 0.04);
  }

  &:last-child {
    border-bottom: none;
  }
}

.row-main {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.version-tag {
  font-weight: 600;
  color: var(--color-primary);
}

.latest-tag {
  font-size: 10px;
  background: var(--color-primary);
  color: white;
  padding: 1px 6px;
  border-radius: 8px;
}

.creator,
.time {
  color: var(--text-tertiary);
  font-size: 11px;
}

.time {
  margin-left: auto;
}

.comment {
  margin: 4px 0;
  color: var(--text-secondary);
  font-size: 11px;
  padding-left: 0;
}

.row-actions {
  display: flex;
  gap: var(--space-xs);
  margin-top: 4px;
}

.mini-btn {
  background: transparent;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  padding: 2px 10px;
  font-size: 11px;
  cursor: pointer;
  color: var(--text-secondary);
  transition: all var(--transition-base);

  &:hover {
    background: var(--bg-tertiary);
    color: var(--color-primary);
  }

  &.danger:hover {
    color: var(--color-danger);
  }
}

.empty {
  text-align: center;
  padding: var(--space-md);
  color: var(--text-tertiary);
  font-size: 12px;
}
</style>