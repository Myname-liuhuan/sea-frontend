<script setup lang="ts">
import DataTable, { type DataTableColumn } from '@/components/DataTable.vue'
import { useModelList } from '@/hooks/useModelList'
import { PAGE_SIZE_OPTIONS } from '@/constants'
import { WORKFLOW_MODEL_PERMS } from '@/constants/workflow'

const {
  searchForm,
  loading,
  dataSource,
  pagination,
  handleSearch,
  handleReset,
  handleCreate,
  handleEdit,
  handleDelete,
  handleDeploy,
  handleClone,
  onPageChange,
  onPageSizeChange,
} = useModelList()

const columns: DataTableColumn[] = [
  { key: 'name', title: '模型名称', width: '200px' },
  { key: 'key', title: 'Key', width: '180px' },
  { key: 'category', title: '分类', width: '120px' },
  { key: 'businessType', title: '业务类型', width: '140px' },
  { key: 'version', title: '版本', width: '80px', align: 'center' },
  { key: 'deploymentId', title: '部署状态', width: '120px' },
  { key: 'creatorName', title: '创建人', width: '120px' },
  { key: 'createTime', title: '创建时间', width: '180px' },
  { key: 'action', title: '操作', width: '300px', sticky: true },
]
</script>

<template>
  <div class="model-list-page">
    <!-- 搜索区域 -->
    <div class="search-section">
      <div class="search-form">
        <div class="form-item">
          <label>名称</label>
          <input
            v-model="searchForm.name"
            placeholder="模糊匹配"
            class="search-input"
            @keyup.enter="handleSearch"
          />
        </div>
        <div class="form-item">
          <label>Key</label>
          <input
            v-model="searchForm.key"
            placeholder="精确匹配"
            class="search-input"
            @keyup.enter="handleSearch"
          />
        </div>
        <div class="form-item">
          <label>业务类型</label>
          <input
            v-model="searchForm.businessType"
            placeholder="如 LEAVE"
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

    <!-- 操作栏 -->
    <div class="toolbar">
      <div class="toolbar-title">
        <span class="title">流程模型</span>
        <span class="count">{{ pagination.total || 0 }} 条记录</span>
      </div>
      <button
        class="btn btn-primary"
        v-has-permi="WORKFLOW_MODEL_PERMS.WRITE"
        @click="handleCreate"
      >
        新建模型
      </button>
    </div>

    <!-- 表格 -->
    <DataTable
      :columns="columns"
      :data="dataSource"
      :loading="loading"
      :total="pagination.total"
      :page-size="pagination.pageSize"
      :current="pagination.current"
      :page-size-options="[...PAGE_SIZE_OPTIONS]"
      row-key="id"
      @page-change="onPageChange"
      @page-size-change="onPageSizeChange"
    >
      <template #cell-name="{ row }">{{ row.name }}</template>
      <template #cell-key="{ row }">{{ row.key }}</template>
      <template #cell-category="{ row }">{{ row.category || '-' }}</template>
      <template #cell-businessType="{ row }">{{ row.businessType || '-' }}</template>
      <template #cell-version="{ row }">v{{ row.version }}</template>
      <template #cell-deploymentId="{ row }">
        <span v-if="row.deploymentId" class="status-tag success">已部署</span>
        <span v-else class="status-tag">未部署</span>
      </template>
      <template #cell-creatorName="{ row }">{{ row.creatorName || '-' }}</template>
      <template #cell-createTime="{ row }">{{ row.createTime }}</template>
      <template #cell-action="{ row }">
        <div class="table-actions">
          <button
            class="action-btn"
            v-has-permi="WORKFLOW_MODEL_PERMS.READ"
            @click="handleEdit(row)"
          >
            设计
          </button>
          <button
            class="action-btn"
            v-has-permi="WORKFLOW_MODEL_PERMS.DEPLOY"
            @click="handleDeploy(row)"
          >
            {{ row.deploymentId ? '重新部署' : '部署' }}
          </button>
          <button
            class="action-btn"
            v-has-permi="WORKFLOW_MODEL_PERMS.WRITE"
            @click="handleClone(row)"
          >
            克隆
          </button>
          <button
            class="action-btn danger"
            v-has-permi="WORKFLOW_MODEL_PERMS.DELETE"
            @click="handleDelete(row)"
          >
            删除
          </button>
        </div>
      </template>
    </DataTable>
  </div>
</template>

<style scoped lang="scss">
.model-list-page {
  animation: fadeIn 0.4s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

/* 共享搜索 / 工具栏样式已迁移到 global.scss */

/* model 页面 keyword 输入框略宽于默认 160px，因为有 key / 业务类型这种长字符串 */
.model-list-page {
  .search-input { width: 180px; }
}
</style>