<script setup lang="ts">
import { useAllTasks } from '@/hooks/useAllTasks'
import { WORKFLOW_STATUS_LABEL } from '@/types/workflow'
import DataTable, { type DataTableColumn } from '@/components/DataTable.vue'

const {
  searchForm,
  loading,
  dataSource,
  pagination,
  handleSearch,
  handleReset,
  onPageChange,
  onPageSizeChange,
} = useAllTasks()

const columns: DataTableColumn[] = [
  { key: 'taskNo', title: '工单号', width: '180px' },
  { key: 'applicantName', title: '申请人', width: '120px' },
  { key: 'targetUserName', title: '目标用户', width: '120px' },
  { key: 'reason', title: '原因', width: 'auto', ellipsis: true },
  { key: 'urgency', title: '紧急', width: '80px', align: 'center' },
  { key: 'status', title: '状态', width: '100px', align: 'center' },
  { key: 'currentNode', title: '当前节点', width: '140px' },
  { key: 'createTime', title: '提交时间', width: '180px' },
  { key: 'action', title: '操作', width: '120px' },
]
</script>

<template>
  <div class="all-tasks-page">
    <div class="search-section">
      <div class="search-form">
        <div class="form-item">
          <label>状态</label>
          <select v-model="searchForm.status" class="search-select">
            <option :value="undefined">全部</option>
            <option :value="0">待审批</option>
            <option :value="1">审批中</option>
            <option :value="3">已拒绝</option>
            <option :value="5">已完成</option>
          </select>
        </div>
        <div class="form-item">
          <label>紧急程度</label>
          <select v-model="searchForm.urgency" class="search-select">
            <option :value="undefined">全部</option>
            <option :value="1">普通</option>
            <option :value="2">紧急</option>
          </select>
        </div>
        <div class="form-item">
          <label>申请人 ID</label>
          <input
            v-model.number="searchForm.applicantId"
            type="number"
            placeholder="可选"
            class="search-input"
          />
        </div>
        <div class="form-item">
          <label>目标用户 ID</label>
          <input
            v-model.number="searchForm.targetUserId"
            type="number"
            placeholder="可选"
            class="search-input"
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
      row-key="id"
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
        <router-link
          class="action-btn"
          :to="{ name: 'WorkflowDetail', query: { taskNo: row.taskNo } }"
        >
          详情
        </router-link>
      </template>
    </DataTable>
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
</style>
