<script setup lang="ts">
import { useUserPage } from '@/hooks/useUserPage'
import { PAGE_SIZE_OPTIONS, USER_BAN_STATUS } from '@/constants'
import DataTable, { type DataTableColumn } from '@/components/DataTable.vue'

const userColumns: DataTableColumn[] = [
  { key: 'username', title: '用户名', width: '140px' },
  { key: 'email', title: '邮箱', width: '200px' },
  { key: 'mobile', title: '手机号', width: '140px' },
  { key: 'avatarUrl', title: '头像', width: '200px' },
  { key: 'isBanned', title: '状态', width: '100px' },
  { key: 'createTime', title: '创建时间', width: '180px' },
  { key: 'action', title: '操作', width: '160px' },
]

const {
  searchForm,
  loading,
  dataSource,
  pagination,
  modalVisible,
  modalLoading,
  isEdit,
  formData,
  handleSearch,
  handleReset,
  openAddModal,
  openEditModal,
  handleSubmit,
  handleDelete,
  onPageChange,
  onPageSizeChange,
  closeModal,
} = useUserPage()
</script>

<template>
  <div class="user-page">
    <!-- 搜索区域 -->
    <div class="search-section">
      <div class="search-form">
        <div class="form-item">
          <label>用户名</label>
          <input v-model="searchForm.username" placeholder="请输入用户名" class="search-input" @keyup.enter="handleSearch" />
        </div>
        <div class="form-item">
          <label>手机号</label>
          <input v-model="searchForm.mobile" placeholder="请输入手机号" class="search-input" @keyup.enter="handleSearch" />
        </div>
        <div class="form-actions">
          <button class="btn btn-primary" @click="handleSearch">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"/>
              <path d="M21 21l-4.35-4.35"/>
            </svg>
            搜索
          </button>
          <button class="btn btn-default" @click="handleReset">重置</button>
        </div>
      </div>
    </div>

    <!-- 操作栏 -->
    <div class="toolbar">
      <div class="toolbar-title">
        <span class="title">用户列表</span>
        <span class="count">{{ pagination.total || 0 }} 条记录</span>
      </div>
      <button class="btn btn-primary" v-has-permi="'sys:user:add'" @click="openAddModal">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="12" y1="5" x2="12" y2="19"/>
          <line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        新增
      </button>
    </div>

    <!-- 表格 -->
    <DataTable
      :columns="userColumns"
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
      <template #cell-username="{ row }">{{ row.username }}</template>
      <template #cell-email="{ row }">{{ row.email || '-' }}</template>
      <template #cell-mobile="{ row }">{{ row.mobile || '-' }}</template>
      <template #cell-avatarUrl="{ row }">{{ row.avatarUrl || '-' }}</template>
      <template #cell-isBanned="{ row }">
        <span class="status-tag" :class="row.isBanned === USER_BAN_STATUS.BANNED ? 'danger' : 'success'">
          {{ row.isBanned === USER_BAN_STATUS.BANNED ? '封禁' : '正常' }}
        </span>
      </template>
      <template #cell-createTime="{ row }">{{ row.createTime }}</template>
      <template #cell-action="{ row }">
        <div class="table-actions">
          <button class="action-btn" v-has-permi="'sys:user:edit'" @click="openEditModal(row)">编辑</button>
          <button class="action-btn danger" v-has-permi="'sys:user:delete'" @click="handleDelete(row)">删除</button>
        </div>
      </template>
    </DataTable>

    <!-- 弹窗 -->
    <div v-if="modalVisible" class="modal-mask" @click.self="closeModal">
      <div class="modal-container">
        <div class="modal-header">
          <h3>{{ isEdit ? '编辑用户' : '新增用户' }}</h3>
          <button class="modal-close" @click="closeModal">&times;</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>用户名 <span class="required">*</span></label>
            <input v-model="formData.username" placeholder="请输入用户名" class="form-input" :disabled="isEdit" />
          </div>
          <div v-if="!isEdit" class="form-group">
            <label>密码 <span class="required">*</span></label>
            <input v-model="formData.password" type="password" placeholder="请输入密码" class="form-input" />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>邮箱</label>
              <input v-model="formData.email" placeholder="请输入邮箱" class="form-input" />
            </div>
            <div class="form-group">
              <label>手机号</label>
              <input v-model="formData.mobile" placeholder="请输入手机号" class="form-input" />
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-default" @click="closeModal">取消</button>
          <button class="btn btn-primary" @click="handleSubmit" :disabled="modalLoading">
            {{ modalLoading ? '保存中...' : '确定' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.user-page {
  animation: fadeIn 0.4s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

.search-section {
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
  padding: var(--space-lg);
  margin-bottom: var(--space-md);
  border: 1px solid var(--border-light);
}

.search-form {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-md);
  align-items: flex-end;
}

.form-item {
  display: flex;
  flex-direction: column;
  gap: 6px;

  label {
    font-size: 13px;
    color: var(--text-secondary);
    font-weight: 500;
  }
}

.search-input {
  width: 160px;
  height: 36px;
  padding: 0 12px;
  font-size: 13px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  outline: none;

  &:focus {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 2px rgba(var(--color-primary-rgb), 0.06);
  }
}

.form-actions {
  display: flex;
  gap: var(--space-sm);
}

.btn {
  height: 36px;
  padding: 0 16px;
  font-size: 13px;
  font-weight: 500;
  border-radius: var(--radius-sm);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  border: none;
  transition: all var(--transition-base);

  svg { width: 16px; height: 16px; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
}

.btn-primary {
  background: var(--color-primary);
  color: var(--bg-secondary);
  &:hover:not(:disabled) { background: var(--color-primary-light); }
}

.btn-default {
  background: var(--bg-secondary);
  color: var(--color-primary-light);
  border: 1px solid var(--border-color);
  &:hover { background: var(--bg-primary); }
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-md) 0;
}

.toolbar-title {
  display: flex;
  align-items: baseline;
  gap: var(--space-sm);

  .title { font-size: 16px; font-weight: 600; color: var(--text-primary); }
  .count { font-size: 13px; color: var(--text-tertiary); }
}

.form-group {
  margin-bottom: var(--space-md);

  label {
    display: block;
    font-size: 13px;
    color: var(--text-secondary);
    font-weight: 500;
    margin-bottom: 6px;
  }

  .required { color: var(--color-danger); }
}

.form-input {
  width: 100%;
  height: 36px;
  padding: 0 12px;
  font-size: 13px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  outline: none;

  &:focus {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 2px rgba(var(--color-primary-rgb), 0.06);
  }
  &:disabled {
    background: var(--bg-primary);
    color: var(--text-tertiary);
  }
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-md);
}
</style>
