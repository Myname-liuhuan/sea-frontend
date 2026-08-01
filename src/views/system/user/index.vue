<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Message } from '@arco-design/web-vue'
import { useUserPage } from '@/hooks/system/useUserPage'
import { PAGE_SIZE_OPTIONS, USER_BAN_STATUS } from '@/constants'
import DataTable, { type DataTableColumn } from '@/components/DataTable.vue'
import ApplyResetPasswordModal from '@/views/workflow/ApplyResetPasswordModal.vue'

const userColumns: DataTableColumn[] = [
  { key: 'username', title: '用户名', width: '140px' },
  { key: 'email', title: '邮箱', width: '200px' },
  { key: 'mobile', title: '手机号', width: '140px' },
  { key: 'avatarUrl', title: '头像', width: '200px' },
  { key: 'isBanned', title: '状态', width: '100px' },
  { key: 'createTime', title: '创建时间', width: '180px' },
  { key: 'action', title: '操作', width: '260px' },
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

const router = useRouter()

interface ApplyTarget {
  id: number | string
  username?: string
}
const applyTarget = ref<ApplyTarget | null>(null)
const applyModalRef = ref<InstanceType<typeof ApplyResetPasswordModal> | null>(null)

function openApplyModal(row: ApplyTarget) {
  applyTarget.value = { id: Number(row.id), username: row.username }
  applyModalRef.value?.open()
}

function onApplySubmitted(taskNo: string) {
  void taskNo
  Message.success('可在"我的申请"查看进度')
  router.push({ name: 'WorkflowMy', query: { taskNo } }).catch(() => undefined)
}
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
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"/>
              <path d="M21 21l-4.35-4.35"/>
            </svg>搜索
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
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="12" y1="5" x2="12" y2="19"/>
          <line x1="5" y1="12" x2="19" y2="12"/>
        </svg>新增
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
          <button class="action-btn" v-has-permi="'workflow:apply'" @click="openApplyModal(row)">申请重置</button>
        </div>
      </template>
    </DataTable>

    <ApplyResetPasswordModal
      v-if="applyTarget"
      ref="applyModalRef"
      :target-user="applyTarget"
      @submitted="onApplySubmitted"
    />

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

/* 共享搜索 / 工具栏样式已迁移到 global.scss，这里只保留 user 页面特有样式 */

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
