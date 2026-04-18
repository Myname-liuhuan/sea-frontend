<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useTable } from '@/composables/useTable'
import { getUserList, addUser, updateUser, deleteUser, getRoleOptions } from '@/api/user'
import type { SysUser, SysUserQuery, SysUserDTO } from '@/types'
import { Message, Modal } from '@arco-design/web-vue'

const searchForm = reactive({
  username: '',
  phone: '',
  status: undefined as number | undefined,
})

const { loading, dataSource, pagination, fetchData, onPageChange, onPageSizeChange } = useTable<SysUser, SysUserQuery>({
  api: getUserList,
  defaultParams: { pageSize: 10 },
})

const modalVisible = ref(false)
const modalLoading = ref(false)
const isEdit = ref(false)
const formRef = ref()

const formData = reactive<SysUserDTO>({
  username: '',
  nickname: '',
  password: '',
  email: '',
  phone: '',
  sex: 0,
  status: 1,
  deptId: 0,
  roleIds: [],
})

const roleOptions = ref<{ label: string; value: number }[]>([])

const statusOptions = [
  { label: '正常', value: 1 },
  { label: '停用', value: 0 },
]

const sexOptions = [
  { label: '男', value: 1 },
  { label: '女', value: 0 },
  { label: '未知', value: 2 },
]

async function loadRoleOptions() {
  const res = await getRoleOptions()
  if (res.code === 200) {
    roleOptions.value = res.data.map((r) => ({ label: r.roleName, value: r.roleId }))
  }
}

function handleSearch() {
  pagination.current = 1
  fetchData({
    username: searchForm.username || undefined,
    phone: searchForm.phone || undefined,
    status: searchForm.status,
  } as Partial<SysUserQuery>)
}

function handleReset() {
  searchForm.username = ''
  searchForm.phone = ''
  searchForm.status = undefined
  handleSearch()
}

function openAddModal() {
  isEdit.value = false
  Object.assign(formData, {
    userId: undefined,
    username: '',
    nickname: '',
    password: '',
    email: '',
    phone: '',
    sex: 0,
    status: 1,
    deptId: 0,
    roleIds: [],
  })
  loadRoleOptions()
  modalVisible.value = true
}

function openEditModal(row: SysUser) {
  isEdit.value = true
  Object.assign(formData, {
    userId: row.userId,
    username: row.username,
    nickname: row.nickname,
    password: '',
    email: row.email || '',
    phone: row.phone || '',
    sex: row.sex || 0,
    status: row.status || 1,
    deptId: row.deptId || 0,
    roleIds: row.roleIds || [],
  })
  loadRoleOptions()
  modalVisible.value = true
}

async function handleSubmit() {
  const valid = await formRef.value?.validate()
  if (!valid) return

  modalLoading.value = true
  try {
    const api = isEdit.value ? updateUser : addUser
    const res = await api(formData)
    if (res.code === 200) {
      Message.success(isEdit.value ? '修改成功' : '新增成功')
      modalVisible.value = false
      fetchData()
    }
  } finally {
    modalLoading.value = false
  }
}

function handleDelete(row: SysUser) {
  Modal.warning({
    title: '确认删除',
    content: `确定要删除用户 "${row.nickname}" 吗？`,
    okText: '确定',
    cancelText: '取消',
    async onOk() {
      const res = await deleteUser(row.userId)
      if (res.code === 200) {
        Message.success('删除成功')
        fetchData()
      }
    },
  })
}

function formatStatus(status: number) {
  return status === 1 ? '正常' : '停用'
}

function formatSex(sex: number) {
  return sexOptions.find((s) => s.value === sex)?.label || '未知'
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
          <input v-model="searchForm.phone" placeholder="请输入手机号" class="search-input" @keyup.enter="handleSearch" />
        </div>
        <div class="form-item">
          <label>状态</label>
          <select v-model="searchForm.status" class="search-select">
            <option :value="undefined">全部</option>
            <option v-for="opt in statusOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
          </select>
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
            <th>昵称</th>
            <th>性别</th>
            <th>手机号</th>
            <th>状态</th>
            <th>角色</th>
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
          <tr v-for="row in dataSource" :key="row.userId">
            <td>{{ row.username }}</td>
            <td>{{ row.nickname }}</td>
            <td>{{ formatSex(row.sex) }}</td>
            <td>{{ row.phone || '-' }}</td>
            <td>
              <span class="status-tag" :class="row.status === 1 ? 'success' : 'danger'">
                {{ formatStatus(row.status) }}
              </span>
            </td>
            <td>{{ row.roleNames || '-' }}</td>
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
        共 {{ pagination.total }} 条，第 {{ pagination.current }}/{{ Math.ceil(pagination.total / pagination.pageSize) || 1 }} 页
      </div>
      <div class="pagination-controls">
        <select :value="pagination.pageSize" @change="(e: any) => onPageSizeChange(e.target.value)" class="page-size-select">
          <option :value="10">10 条/页</option>
          <option :value="20">20 条/页</option>
          <option :value="50">50 条/页</option>
        </select>
        <button :disabled="pagination.current === 1" @click="onPageChange(pagination.current - 1)">上一页</button>
        <button :disabled="pagination.current >= Math.ceil(pagination.total / pagination.pageSize)" @click="onPageChange(pagination.current + 1)">下一页</button>
      </div>
    </div>

    <!-- 弹窗 -->
    <div v-if="modalVisible" class="modal-mask" @click.self="modalVisible = false">
      <div class="modal-container">
        <div class="modal-header">
          <h3>{{ isEdit ? '编辑用户' : '新增用户' }}</h3>
          <button class="modal-close" @click="modalVisible = false">&times;</button>
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
          <div class="form-group">
            <label>昵称 <span class="required">*</span></label>
            <input v-model="formData.nickname" placeholder="请输入昵称" class="form-input" />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>手机号</label>
              <input v-model="formData.phone" placeholder="请输入手机号" class="form-input" />
            </div>
            <div class="form-group">
              <label>邮箱</label>
              <input v-model="formData.email" placeholder="请输入邮箱" class="form-input" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>性别</label>
              <div class="radio-group">
                <label v-for="opt in sexOptions" :key="opt.value" class="radio-item">
                  <input type="radio" :value="opt.value" v-model="formData.sex" />
                  <span>{{ opt.label }}</span>
                </label>
              </div>
            </div>
            <div class="form-group">
              <label>状态</label>
              <div class="radio-group">
                <label v-for="opt in statusOptions" :key="opt.value" class="radio-item">
                  <input type="radio" :value="opt.value" v-model="formData.status" />
                  <span>{{ opt.label }}</span>
                </label>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-default" @click="modalVisible = false">取消</button>
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

.search-input,
.search-select {
  height: 36px;
  padding: 0 12px;
  font-size: 13px;
  border: 1px solid #e8e8e8;
  border-radius: 6px;
  outline: none;
  transition: all 0.2s;

  &:focus {
    border-color: #1a1a1a;
    box-shadow: 0 0 0 2px rgba(26, 26, 26, 0.06);
  }
}

.search-input {
  width: 160px;
}

.search-select {
  width: 120px;
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

  svg {
    width: 16px;
    height: 16px;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.btn-primary {
  background: #1a1a1a;
  color: #fff;

  &:hover:not(:disabled) {
    background: #333;
  }
}

.btn-default {
  background: #fff;
  color: #333;
  border: 1px solid #e8e8e8;

  &:hover {
    background: #fafafa;
  }
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

  .title {
    font-size: 16px;
    font-weight: 600;
    color: #1a1a1a;
  }

  .count {
    font-size: 13px;
    color: #999;
  }
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
    transition: background 0.2s;

    &:hover {
      background: #fafafa;
    }

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

  &:hover {
    background: #e6f7ff;
  }

  &.danger {
    color: #ff4d4f;

    &:hover {
      background: #fff1f0;
    }
  }
}

.empty-row td,
.loading-row td {
  text-align: center;
  padding: 48px 16px;
}

.empty-state,
.loading-spinner {
  color: #999;
  font-size: 13px;
}

.pagination-wrapper {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 0;
}

.pagination-info {
  font-size: 13px;
  color: #666;
}

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

    &:hover:not(:disabled) {
      background: #fafafa;
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }
}

.page-size-select {
  height: 32px;
  padding: 0 8px;
  border: 1px solid #e8e8e8;
  border-radius: 6px;
  font-size: 13px;
}

/* 弹窗样式 */
.modal-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-container {
  width: 520px;
  max-height: 90vh;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  animation: modalIn 0.2s ease-out;
  display: flex;
  flex-direction: column;
}

@keyframes modalIn {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid #f0f0f0;

  h3 {
    font-size: 16px;
    font-weight: 600;
    color: #1a1a1a;
    margin: 0;
  }
}

.modal-close {
  width: 28px;
  height: 28px;
  font-size: 20px;
  color: #999;
  background: none;
  border: none;
  cursor: pointer;
  border-radius: 4px;

  &:hover {
    background: #f5f5f5;
    color: #333;
  }
}

.modal-body {
  padding: 24px;
  overflow-y: auto;
  flex: 1;
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

  .required {
    color: #ff4d4f;
  }
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

.radio-group {
  display: flex;
  gap: 16px;
  padding-top: 6px;
}

.radio-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #333;
  cursor: pointer;

  input[type="radio"] {
    accent-color: #1a1a1a;
  }
}

.modal-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid #f0f0f0;
}
</style>