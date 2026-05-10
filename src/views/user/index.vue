<script setup lang="ts">
import { useUserPage } from '@/hooks/useUserPage'
import { PAGE_SIZE_OPTIONS, USER_BAN_STATUS } from '@/constants'

const {
  searchForm,
  loading,
  dataSource,
  pagination,
  modalVisible,
  modalLoading,
  isEdit,
  formData,
  totalPages,
  handleSearch,
  handleReset,
  openAddModal,
  openEditModal,
  handleSubmit,
  handleDelete,
  onPageChange,
  handlePageSizeChange,
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
      <button class="btn btn-primary" @click="openAddModal">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="12" y1="5" x2="12" y2="19"/>
          <line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        新增
      </button>
    </div>

    <!-- 表格 -->
    <div class="table-wrapper">
      <table class="data-table">
        <thead>
          <tr>
            <th>用户名</th>
            <th>邮箱</th>
            <th>手机号</th>
            <th>头像</th>
            <th>状态</th>
            <th>创建时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading" class="loading-row">
            <td colspan="8">
              <div class="loading-spinner">加载中...</div>
            </td>
          </tr>
          <tr v-else-if="!dataSource.length" class="empty-row">
            <td colspan="8">
              <div class="empty-state">暂无数据</div>
            </td>
          </tr>
          <tr v-for="row in dataSource" :key="row.id">
            <td>{{ row.username }}</td>
            <td>{{ row.email || '-' }}</td>
            <td>{{ row.mobile || '-' }}</td>
            <td>{{ row.avatarUrl || '-' }}</td>
            <td>
              <span class="status-tag" :class="row.isBanned === USER_BAN_STATUS.BANNED ? 'danger' : 'success'">
                {{ row.isBanned === USER_BAN_STATUS.BANNED ? '封禁' : '正常' }}
              </span>
            </td>
            <td>{{ row.createTime }}</td>
            <td>
              <div class="table-actions">
                <button class="action-btn" @click="openEditModal(row)">编辑</button>
                <button class="action-btn danger" @click="handleDelete(row)">删除</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 分页 -->
    <div class="pagination-wrapper">
      <div class="pagination-info">
        共 {{ pagination.total }} 条，第 {{ pagination.current }}/{{ totalPages }} 页
      </div>
      <div class="pagination-controls">
        <select :value="pagination.pageSize" @change="handlePageSizeChange" class="page-size-select">
          <option v-for="size in PAGE_SIZE_OPTIONS" :key="size" :value="size">{{ size }} 条/页</option>
        </select>
        <button :disabled="pagination.current === 1" @click="onPageChange(pagination.current - 1)">上一页</button>
        <button :disabled="pagination.current >= totalPages" @click="onPageChange(pagination.current + 1)">下一页</button>
      </div>
    </div>

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
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 16px;
  border: 1px solid #f0f0f0;
}

.search-form {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: flex-end;
}

.form-item {
  display: flex;
  flex-direction: column;
  gap: 6px;

  label {
    font-size: 13px;
    color: #666;
    font-weight: 500;
  }
}

.search-input {
  width: 160px;
  height: 36px;
  padding: 0 12px;
  font-size: 13px;
  border: 1px solid #e8e8e8;
  border-radius: 6px;
  outline: none;

  &:focus {
    border-color: #1a1a1a;
    box-shadow: 0 0 0 2px rgba(26, 26, 26, 0.06);
  }
}

.form-actions {
  display: flex;
  gap: 8px;
}

.btn {
  height: 36px;
  padding: 0 16px;
  font-size: 13px;
  font-weight: 500;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  border: none;
  transition: all 0.2s;

  svg { width: 16px; height: 16px; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
}

.btn-primary {
  background: #1a1a1a;
  color: #fff;
  &:hover:not(:disabled) { background: #333; }
}

.btn-default {
  background: #fff;
  color: #333;
  border: 1px solid #e8e8e8;
  &:hover { background: #fafafa; }
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 0;
}

.toolbar-title {
  display: flex;
  align-items: baseline;
  gap: 8px;

  .title { font-size: 16px; font-weight: 600; color: #1a1a1a; }
  .count { font-size: 13px; color: #999; }
}

.table-wrapper {
  background: #fff;
  border-radius: 12px;
  border: 1px solid #f0f0f0;
  overflow: hidden;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;

  thead {
    background: #fafafa;
    th {
      text-align: left;
      padding: 14px 16px;
      font-weight: 600;
      color: #666;
      border-bottom: 1px solid #f0f0f0;
    }
  }

  tbody tr {
    &:hover { background: #fafafa; }
    td {
      padding: 14px 16px;
      border-bottom: 1px solid #f5f5f5;
    }
  }
}

.status-tag {
  display: inline-block;
  padding: 2px 8px;
  font-size: 12px;
  font-weight: 500;
  border-radius: 4px;

  &.success {
    background: #f6ffed;
    color: #52c41a;
    border: 1px solid #b7eb8f;
  }
  &.danger {
    background: #fff1f0;
    color: #ff4d4f;
    border: 1px solid #ffccc7;
  }
}

.table-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  padding: 4px 8px;
  font-size: 12px;
  color: #1890ff;
  background: none;
  border: none;
  cursor: pointer;
  border-radius: 4px;
  &:hover { background: #e6f7ff; }
  &.danger { color: #ff4d4f; &:hover { background: #fff1f0; } }
}

.empty-row td, .loading-row td {
  text-align: center;
  padding: 48px 16px;
}

.empty-state, .loading-spinner {
  color: #999;
  font-size: 13px;
}

.pagination-wrapper {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 0;
}

.pagination-info { font-size: 13px; color: #666; }

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 8px;

  button {
    height: 32px;
    padding: 0 12px;
    font-size: 13px;
    background: #fff;
    border: 1px solid #e8e8e8;
    border-radius: 6px;
    cursor: pointer;
    &:hover:not(:disabled) { background: #fafafa; }
    &:disabled { opacity: 0.5; cursor: not-allowed; }
  }
}

.page-size-select {
  height: 32px;
  padding: 0 8px;
  border: 1px solid #e8e8e8;
  border-radius: 6px;
  font-size: 13px;
}

.form-group {
  margin-bottom: 16px;

  label {
    display: block;
    font-size: 13px;
    color: #666;
    font-weight: 500;
    margin-bottom: 6px;
  }

  .required { color: #ff4d4f; }
}

.form-input {
  width: 100%;
  height: 36px;
  padding: 0 12px;
  font-size: 13px;
  border: 1px solid #e8e8e8;
  border-radius: 6px;
  outline: none;

  &:focus {
    border-color: #1a1a1a;
    box-shadow: 0 0 0 2px rgba(26, 26, 26, 0.06);
  }
  &:disabled {
    background: #fafafa;
    color: #999;
  }
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
</style>
