<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useTable } from '@/composables/useTable'
import {
  getRoleList,
  addRole,
  updateRole,
  assignUsers,
  assignMenus,
  getAllRoleList,
  getRoleMenuIds,
  getRoleUserIds,
} from '@/api/role'
import { getAllMenuTree } from '@/api/menu'
import { getUserPage } from '@/api/user'
import type { SysRole, SysRoleQuery, SysRoleDTO, SysMenu } from '@/types'
import { Message, Modal } from '@arco-design/web-vue'

const searchForm = reactive({
  roleName: '',
  roleCode: '',
  status: undefined as string | undefined,
})

const { loading, dataSource, pagination, fetchData, onPageChange, onPageSizeChange } = useTable<SysRole, SysRoleQuery>({
  api: getRoleList,
  defaultParams: { pageSize: 10 },
})

const modalVisible = ref(false)
const modalLoading = ref(false)
const isEdit = ref(false)
const formRef = ref()

const formData = reactive<SysRoleDTO>({
  roleName: '',
  roleCode: '',
  roleDesc: '',
  status: '1',
  dataScope: '1',
})

const statusOptions = [
  { label: '正常', value: '1' },
  { label: '停用', value: '0' },
]

// 用户分配弹窗相关
const userModalVisible = ref(false)
const userModalLoading = ref(false)
const userLoading = ref(false)
const allUsers = ref<{ id: string; username: string }[]>([])
const selectedUserIds = ref<string[]>([])
const currentRoleId = ref(0)

// 菜单分配弹窗相关
const menuModalVisible = ref(false)
const menuModalLoading = ref(false)
const menuLoading = ref(false)
const menuTree = ref<SysMenu[]>([])
const menuExpandedKeys = ref<string[]>([])
const selectedMenuIds = ref<string[]>([])
const currentMenuRoleId = ref(0)

function removeIconField<T extends Record<string, any>>(obj: T): T {
  if (!obj) return obj
  const { icon, children, ...rest } = obj
  const result = { ...rest, id: String(obj.id) } as T
  if (children && Array.isArray(children)) {
    (result as any).children = children.map(removeIconField)
  }
  return result
}

function handleSearch() {
  pagination.current = 1
  fetchData({
    roleName: searchForm.roleName || undefined,
    roleCode: searchForm.roleCode || undefined,
    status: searchForm.status,
  } as Partial<SysRoleQuery>)
}

function handleReset() {
  searchForm.roleName = ''
  searchForm.roleCode = ''
  searchForm.status = undefined
  handleSearch()
}

function openAddModal() {
  isEdit.value = false
  Object.assign(formData, {
    id: undefined,
    roleName: '',
    roleCode: '',
    roleDesc: '',
    status: '1',
    dataScope: '1',
  })
  modalVisible.value = true
}

function openEditModal(row: SysRole) {
  isEdit.value = true
  Object.assign(formData, {
    id: row.id,
    roleName: row.roleName,
    roleCode: row.roleCode,
    roleDesc: row.roleDesc,
    status: row.status,
    dataScope: row.dataScope || '1',
  })
  modalVisible.value = true
}

async function handleSubmit() {
  modalLoading.value = true
  try {
    const api = isEdit.value ? updateRole : addRole
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

function handleDelete(row: SysRole) {
  Modal.warning({
    title: '确认删除',
    content: `确定要删除角色 "${row.roleName}" 吗？`,
    okText: '确定',
    cancelText: '取消',
    async onOk() {
      // 后端没有删除接口，提示用户
      Message.error('该接口后端未实现')
    },
  })
}

async function openAssignUsersModal(row: SysRole) {
  currentRoleId.value = row.id
  selectedUserIds.value = []
  userLoading.value = true
  userModalVisible.value = true

  try {
    const [usersRes, checkedRes] = await Promise.all([
      getUserPage({ pageNum: 1, pageSize: 100 }),
      getRoleUserIds(row.id),
    ])
    if (usersRes.code === 200) {
      allUsers.value = usersRes.data.rows.map((u: any) => ({
        id: String(u.id),
        username: u.username,
      }))
    }
    if (checkedRes.code === 200) {
      selectedUserIds.value = checkedRes.data
    }
  } finally {
    userLoading.value = false
  }
}

async function handleAssignUsers() {
  if (!currentRoleId.value) return
  userModalLoading.value = true
  try {
    const res = await assignUsers({
      roleId: currentRoleId.value,
      userIds: selectedUserIds.value,
    })
    if (res.code === 200) {
      Message.success('分配成功')
      userModalVisible.value = false
    }
  } finally {
    userModalLoading.value = false
  }
}

async function openAssignMenusModal(row: SysRole) {
  currentMenuRoleId.value = row.id
  selectedMenuIds.value = []
  menuLoading.value = true
  menuModalVisible.value = true

  try {
    const [menuRes, checkedRes] = await Promise.all([
      getAllMenuTree(),
      getRoleMenuIds(row.id),
    ])
    if (menuRes.code === 200) {
      menuTree.value = menuRes.data.map(removeIconField)
      menuExpandedKeys.value = menuRes.data.map((m: SysMenu) => String(m.id))
    }
    if (checkedRes.code === 200) {
      selectedMenuIds.value = checkedRes.data
    }
  } finally {
    menuLoading.value = false
  }
}

async function handleAssignMenus() {
  if (!currentMenuRoleId.value) return
  menuModalLoading.value = true
  try {
    const res = await assignMenus({
      roleId: currentMenuRoleId.value,
      menuIds: selectedMenuIds.value,
    })
    if (res.code === 200) {
      Message.success('分配成功')
      menuModalVisible.value = false
    }
  } finally {
    menuModalLoading.value = false
  }
}

function formatStatus(status: string) {
  return status === '1' ? '正常' : '停用'
}
</script>

<template>
  <div class="role-page">
    <!-- 搜索区域 -->
    <div class="search-section">
      <div class="search-form">
        <div class="form-item">
          <label>角色名称</label>
          <input v-model="searchForm.roleName" placeholder="请输入角色名称" class="search-input" />
        </div>
        <div class="form-item">
          <label>权限字符</label>
          <input v-model="searchForm.roleCode" placeholder="请输入权限字符" class="search-input" />
        </div>
        <div class="form-item">
          <label>状态</label>
          <select v-model="searchForm.status" class="search-select">
            <option :value="undefined">全部</option>
            <option v-for="opt in statusOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
          </select>
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
        <span class="title">角色列表</span>
        <span class="count">{{ pagination.total || 0 }} 条记录</span>
      </div>
      <button class="btn btn-primary" @click="openAddModal">新增</button>
    </div>

    <!-- 表格 -->
    <div class="table-wrapper">
      <table class="data-table">
        <thead>
          <tr>
            <th>角色名称</th>
            <th>权限字符</th>
            <th>角色描述</th>
            <th>状态</th>
            <th>创建时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading" class="loading-row">
            <td colspan="6"><div class="loading-text">加载中...</div></td>
          </tr>
          <tr v-else-if="!dataSource.length" class="empty-row">
            <td colspan="6"><div class="empty-state">暂无数据</div></td>
          </tr>
          <tr v-for="row in dataSource" :key="row.id">
            <td>{{ row.roleName }}</td>
            <td>{{ row.roleCode }}</td>
            <td>{{ row.roleDesc || '-' }}</td>
            <td>
              <span class="status-tag" :class="row.status === '1' ? 'success' : 'danger'">
                {{ formatStatus(row.status) }}
              </span>
            </td>
            <td>{{ row.createTime }}</td>
            <td>
              <div class="table-actions">
                <button class="action-btn" @click="openEditModal(row)">编辑</button>
                <button class="action-btn" @click="openAssignUsersModal(row)">分配用户</button>
                <button class="action-btn" @click="openAssignMenusModal(row)">分配权限</button>
                <button class="action-btn danger" @click="handleDelete(row)">删除</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 分页 -->
    <div class="pagination-wrapper">
      <div class="pagination-info">共 {{ pagination.total }} 条</div>
      <div class="pagination-controls">
        <select :value="pagination.pageSize" @change="(e: any) => onPageSizeChange(e.target.value)" class="page-size-select">
          <option :value="10">10 条/页</option>
          <option :value="20">20 条/页</option>
        </select>
        <button :disabled="pagination.current === 1" @click="onPageChange(pagination.current - 1)">上一页</button>
        <button :disabled="pagination.current >= Math.ceil(pagination.total / pagination.pageSize)" @click="onPageChange(pagination.current + 1)">下一页</button>
      </div>
    </div>

    <!-- 弹窗 -->
    <div v-if="modalVisible" class="modal-mask" @click.self="modalVisible = false">
      <div class="modal-container">
        <div class="modal-header">
          <h3>{{ isEdit ? '编辑角色' : '新增角色' }}</h3>
          <button class="modal-close" @click="modalVisible = false">&times;</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>角色名称 <span class="required">*</span></label>
            <input v-model="formData.roleName" placeholder="请输入角色名称" class="form-input" />
          </div>
          <div class="form-group">
            <label>权限字符 <span class="required">*</span></label>
            <input v-model="formData.roleCode" placeholder="请输入权限字符" class="form-input" />
          </div>
          <div class="form-group">
            <label>角色描述</label>
            <input v-model="formData.roleDesc" placeholder="请输入角色描述" class="form-input" />
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
        <div class="modal-footer">
          <button class="btn btn-default" @click="modalVisible = false">取消</button>
          <button class="btn btn-primary" @click="handleSubmit" :disabled="modalLoading">{{ modalLoading ? '保存中...' : '确定' }}</button>
        </div>
      </div>
    </div>

    <!-- 分配用户弹窗 -->
    <div v-if="userModalVisible" class="modal-mask" @click.self="userModalVisible = false">
      <div class="modal-container" style="width: 600px;">
        <div class="modal-header">
          <h3>分配用户</h3>
          <button class="modal-close" @click="userModalVisible = false">&times;</button>
        </div>
        <div class="modal-body">
          <div v-if="userLoading" class="loading-text">加载中...</div>
          <template v-else>
            <div class="user-list">
              <label v-for="user in allUsers" :key="user.id" class="user-item">
                <input type="checkbox" :value="user.id" v-model="selectedUserIds" />
                <span>{{ user.username }}</span>
              </label>
            </div>
          </template>
        </div>
        <div class="modal-footer">
          <button class="btn btn-default" @click="userModalVisible = false">取消</button>
          <button class="btn btn-primary" @click="handleAssignUsers" :disabled="userModalLoading">{{ userModalLoading ? '保存中...' : '确定' }}</button>
        </div>
      </div>
    </div>

    <!-- 分配菜单弹窗 -->
    <div v-if="menuModalVisible" class="modal-mask" @click.self="menuModalVisible = false">
      <div class="modal-container" style="width: 500px;">
        <div class="modal-header">
          <h3>分配菜单权限</h3>
          <button class="modal-close" @click="menuModalVisible = false">&times;</button>
        </div>
        <div class="modal-body">
          <div v-if="menuLoading" class="loading-text">加载中...</div>
          <div v-else class="menu-tree">
            <!-- 菜单树使用 Arco Design Tree 组件 -->
            <a-tree
              v-model:checked-keys="selectedMenuIds"
              v-model:expanded-keys="menuExpandedKeys"
              :data="(menuTree as any)"
              :field-names="{ key: 'id', title: 'menuName', children: 'children' }"
              checkable
              block-node
            />
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-default" @click="menuModalVisible = false">取消</button>
          <button class="btn btn-primary" @click="handleAssignMenus" :disabled="menuModalLoading">{{ menuModalLoading ? '保存中...' : '确定' }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.role-page {
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

.search-input, .search-select {
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

.search-input { width: 160px; }
.search-select { width: 120px; }

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
  border: none;
  transition: all 0.2s;
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

.empty-state, .loading-text {
  text-align: center;
  padding: 48px 16px;
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

/* 弹窗 */
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
  width: 480px;
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

  h3 { font-size: 16px; font-weight: 600; color: #1a1a1a; margin: 0; }
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
  &:hover { background: #f5f5f5; color: #333; }
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

  input[type="radio"] { accent-color: #1a1a1a; }
}

.modal-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid #f0f0f0;
}

.user-list {
  max-height: 400px;
  overflow-y: auto;
}

.user-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  &:hover { background: #fafafa; }

  input[type="checkbox"] { accent-color: #1a1a1a; }
}

.menu-tree {
  max-height: 400px;
  overflow-y: auto;
}
</style>