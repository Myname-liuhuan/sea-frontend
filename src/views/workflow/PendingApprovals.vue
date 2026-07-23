<script setup lang="ts">
import { ref, reactive } from 'vue'
import { Modal as AModal, Input as AInput } from '@arco-design/web-vue'
import DataTable, { type DataTableColumn } from '@/components/DataTable.vue'
import { usePendingApprovals } from '@/hooks/usePendingApprovals'
import { WORKFLOW_STATUS_LABEL } from '@/types/workflow'

const {
  searchForm,
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
const opRow = ref<OpRow | null>(null)

interface ApproveForm { comment: string }
interface ReassignForm { targetUserId: string; comment: string }
const approveForm = reactive<ApproveForm>({ comment: '' })
const reassignForm = reactive<ReassignForm>({ targetUserId: '', comment: '' })

function openApprove(row: OpRow, approved: boolean) {
  opMode.value = 'approve'
  opApproved.value = approved
  opRow.value = row
  approveForm.comment = ''
  opModalVisible.value = true
}

function openReassign(row: OpRow) {
  opMode.value = 'reassign'
  opRow.value = row
  reassignForm.targetUserId = ''
  reassignForm.comment = ''
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
      approveForm.comment || undefined,
    )
  } else if (opMode.value === 'reassign' && reassignForm.targetUserId) {
    await reassign(
      { taskNo: opRow.value.taskNo } as never,
      Number(reassignForm.targetUserId),
      reassignForm.comment || undefined,
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
        <div class="form-item">
          <label>紧急程度</label>
          <select v-model="searchForm.urgency" class="search-select">
            <option :value="undefined">全部</option>
            <option :value="1">普通</option>
            <option :value="2">紧急</option>
          </select>
        </div>
        <div class="form-item">
          <label>工单号</label>
          <input
            v-model="searchForm.taskNo"
            placeholder="精确匹配"
            class="search-input"
            @keyup.enter="handleSearch"
          />
        </div>
        <div class="form-actions">
          <button class="btn btn-primary" @click="handleSearch">搜索</button>
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
      <a-form v-if="opMode === 'reassign'" label-align="left" :model="reassignForm">
        <a-form-item label="转交用户 ID" required>
          <AInput v-model="reassignForm.targetUserId" placeholder="目标用户 ID" allow-clear />
        </a-form-item>
        <a-form-item label="备注">
          <AInput v-model="reassignForm.comment" placeholder="选填" allow-clear />
        </a-form-item>
      </a-form>
      <a-form v-else label-align="left" :model="approveForm">
        <a-form-item label="审批意见">
          <AInput v-model="approveForm.comment" placeholder="选填" allow-clear />
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
