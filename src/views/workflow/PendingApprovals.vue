<script setup lang="ts">
import { ref } from 'vue'
import { Modal as AModal, Input as AInput } from '@arco-design/web-vue'
import DataTable, { type DataTableColumn } from '@/components/DataTable.vue'
import { usePendingApprovals } from '@/hooks/usePendingApprovals'
import { WORKFLOW_STATUS_LABEL } from '@/types/workflow'

const {
  loading,
  dataSource,
  pagination,
  handleSearch,
  handleReset,
  onPageChange,
  onPageSizeChange,
  approve,
  reassign,
} = usePendingApprovals()

const columns: DataTableColumn[] = [
  { key: 'taskNo', title: '工单号', width: '180px' },
  { key: 'applicantName', title: '申请人', width: '120px' },
  { key: 'targetUserName', title: '目标用户', width: '120px' },
  { key: 'reason', title: '原因', width: 'auto', ellipsis: true },
  { key: 'urgency', title: '紧急', width: '80px', align: 'center' },
  { key: 'status', title: '状态', width: '100px', align: 'center' },
  { key: 'createTime', title: '提交时间', width: '180px' },
  { key: 'action', title: '操作', width: '260px' },
]

interface OpRow {
  taskNo: string
}

const opModalVisible = ref(false)
const opMode = ref<'approve' | 'reassign' | null>(null)
const opApproved = ref<boolean>(true)
const opComment = ref('')
const opTargetUserId = ref<number | null>(null)
const opRow = ref<OpRow | null>(null)

function openApprove(row: OpRow, approved: boolean) {
  opMode.value = 'approve'
  opApproved.value = approved
  opRow.value = row
  opComment.value = ''
  opTargetUserId.value = null
  opModalVisible.value = true
}

function openReassign(row: OpRow) {
  opMode.value = 'reassign'
  opRow.value = row
  opComment.value = ''
  opTargetUserId.value = null
  opModalVisible.value = true
}

function closeOp() {
  opModalVisible.value = false
  opMode.value = null
  opRow.value = null
}

async function submitOp() {
  if (!opRow.value || !opMode.value) return
  if (opMode.value === 'approve') {
    await approve(
      { taskNo: opRow.value.taskNo } as never,
      opApproved.value,
      opComment.value || undefined,
    )
  } else if (opMode.value === 'reassign' && opTargetUserId.value) {
    await reassign(
      { taskNo: opRow.value.taskNo } as never,
      opTargetUserId.value,
      opComment.value || undefined,
    )
  }
  closeOp()
}

const modalTitle = () => {
  if (opMode.value === 'approve') return opApproved.value ? '通过审批' : '拒绝审批'
  if (opMode.value === 'reassign') return '转交 / 委派'
  return ''
}
const modalOkText = () => {
  if (opMode.value === 'approve') return opApproved.value ? '通过' : '拒绝'
  if (opMode.value === 'reassign') return '转交'
  return '确认'
}
</script>

<template>
  <div class="pending-approvals-page">
    <div class="search-section">
      <div class="search-form">
        <div class="form-actions">
          <button class="btn btn-primary" @click="handleSearch">刷新</button>
          <button class="btn btn-default" @click="handleReset">重置</button>
        </div>
      </div>
    </div>

    <DataTable
      :columns="columns"
      :data="dataSource"
      :loading="loading"
      :total="pagination.total"
      :page-size="pagination.pageSize"
      :current="pagination.current"
      row-key="taskNo"
      @page-change="onPageChange"
      @page-size-change="onPageSizeChange"
    >
      <template #cell-urgency="{ row }">
        <span :class="['urgency-tag', row.urgency === 2 ? 'urgent' : 'normal']">
          {{ row.urgency === 2 ? '紧急' : '普通' }}
        </span>
      </template>
      <template #cell-status="{ row }">
        <span class="status-tag">{{ WORKFLOW_STATUS_LABEL[row.status] || '-' }}</span>
      </template>
      <template #cell-action="{ row }">
        <button class="action-btn success" @click="openApprove(row, true)">通过</button>
        <button class="action-btn danger" @click="openApprove(row, false)">拒绝</button>
        <button class="action-btn" @click="openReassign(row)">转交</button>
      </template>
    </DataTable>

    <AModal
      v-model:visible="opModalVisible"
      :title="modalTitle()"
      :ok-text="modalOkText()"
      :cancel-text="'取消'"
      @ok="submitOp"
      @cancel="closeOp"
      @close="closeOp"
    >
      <a-form v-if="opMode === 'reassign'" label-align="left">
        <a-form-item label="转交用户 ID" required>
          <AInput v-model="opTargetUserId" placeholder="目标用户 ID" allow-clear />
        </a-form-item>
        <a-form-item label="备注">
          <AInput v-model="opComment" placeholder="选填" allow-clear />
        </a-form-item>
      </a-form>
      <a-form v-else label-align="left">
        <a-form-item label="审批意见">
          <AInput v-model="opComment" placeholder="选填" allow-clear />
        </a-form-item>
      </a-form>
    </AModal>
  </div>
</template>

<style scoped>
.urgency-tag.normal {
  color: var(--color-text-2);
}
.urgency-tag.urgent {
  color: var(--color-warning);
  font-weight: 600;
}
.action-btn.success {
  color: var(--color-success);
}
.action-btn.danger {
  color: var(--color-danger);
}
.action-btn {
  margin-right: var(--space-sm);
}
</style>
