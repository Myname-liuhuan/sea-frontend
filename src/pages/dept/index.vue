<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import { getDeptTree, addDept, updateDept, deleteDept, getDeptTreeSelect, type SysDept, type SysDeptDTO } from '@/api/dept'
import { Message, Modal } from '@arco-design/web-vue'

const loading = ref(false)
const treeData = ref<SysDept[]>([])

const modalVisible = ref(false)
const modalLoading = ref(false)
const isEdit = ref(false)
const formRef = ref()

const formData = reactive<SysDeptDTO>({
  id: undefined,
  parentId: 0,
  name: '',
  orderNum: 0,
  leader: '',
  mobile: '',
  email: '',
  status: '1',
})

const parentDeptOptions = ref<{ label: string; value: number }[]>([])

const statusOptions = [
  { label: '正常', value: '1' },
  { label: '停用', value: '0' },
]

async function fetchData() {
  loading.value = true
  try {
    const res = await getDeptTree()
    if (res.code === 200) {
      treeData.value = res.data || []
    }
  } finally {
    loading.value = false
  }
}

async function loadParentDeptOptions() {
  const res = await getDeptTreeSelect()
  if (res.code === 200) {
    parentDeptOptions.value = convertToOptions(res.data || [])
  }
}

function convertToOptions(depts: SysDept[], level = 0): { label: string; value: number }[] {
  const result: { label: string; value: number }[] = []
  for (const dept of depts) {
    result.push({
      label: '　'.repeat(level) + dept.name,
      value: dept.id,
    })
    if (dept.children) {
      result.push(...convertToOptions(dept.children, level + 1))
    }
  }
  return result
}

function openAddModal(parentId = 0) {
  isEdit.value = false
  Object.assign(formData, {
    id: undefined,
    parentId: parentId,
    name: '',
    orderNum: 0,
    leader: '',
    mobile: '',
    email: '',
    status: '1',
  })
  loadParentDeptOptions()
  modalVisible.value = true
}

function openEditModal(row: SysDept) {
  isEdit.value = true
  Object.assign(formData, {
    id: row.id,
    parentId: row.parentId,
    name: row.name,
    orderNum: row.orderNum,
    leader: row.leader || '',
    mobile: row.mobile || '',
    email: row.email || '',
    status: row.status,
  })
  loadParentDeptOptions()
  modalVisible.value = true
}

async function handleSubmit() {
  modalLoading.value = true
  try {
    const api = isEdit.value ? updateDept : addDept
    const res = await api(formData)
    if (res.code === 200) {
      Message.success(isEdit.value ? '修改成功' : '新增成功')
      modalVisible.value = false
      fetchData()
    } else {
      Message.error(res.message || '操作失败')
    }
  } finally {
    modalLoading.value = false
  }
}

function handleDelete(row: SysDept) {
  Modal.warning({
    title: '确认删除',
    content: `确定要删除部门 "${row.name}" 吗？`,
    okText: '确定',
    cancelText: '取消',
    async onOk() {
      const res = await deleteDept(row.id)
      if (res.code === 200) {
        Message.success('删除成功')
        fetchData()
      } else {
        Message.error(res.message || '删除失败')
      }
    },
  })
}

function formatStatus(status: string) {
  return status === '1' ? '正常' : '停用'
}

function renderDeptTree(depts: SysDept[], level = 0): { dept: SysDept; level: number }[] {
  const result: { dept: SysDept; level: number }[] = []
  for (const dept of depts) {
    result.push({ dept, level })
    if (dept.children) {
      result.push(...renderDeptTree(dept.children, level + 1))
    }
  }
  return result
}

const flatData = () => {
  return renderDeptTree(treeData.value)
}

onMounted(() => {
  fetchData()
})
</script>

<template>
  <div class="dept-page">
    <div class="page-header">
      <h1>部门管理</h1>
      <p>管理部门组织架构</p>
    </div>

    <!-- 操作栏 -->
    <div class="toolbar">
      <div class="toolbar-title">
        <span class="title">部门列表</span>
        <span class="count">{{ treeData.length }} 个部门</span>
      </div>
      <button class="btn btn-primary" @click="openAddModal(0)">
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
            <th style="width: 200px">部门名称</th>
            <th style="width: 80px">排序</th>
            <th style="width: 120px">负责人</th>
            <th style="width: 140px">联系电话</th>
            <th style="width: 180px">邮箱</th>
            <th style="width: 80px">状态</th>
            <th style="width: 150px">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading">
            <td colspan="7" style="text-align: center; padding: 48px">
              <span>加载中...</span>
            </td>
          </tr>
          <tr v-else-if="!treeData.length">
            <td colspan="7" style="text-align: center; padding: 48px">
              <span>暂无数据</span>
            </td>
          </tr>
          <template v-else>
            <tr v-for="{ dept, level } in flatData()" :key="dept.id">
              <td>
                <span :style="{ paddingLeft: (level * 20) + 'px' }">
                  <span v-if="level > 0" class="tree-indent">└─</span>
                  {{ dept.name }}
                </span>
              </td>
              <td>{{ dept.orderNum }}</td>
              <td>{{ dept.leader || '-' }}</td>
              <td>{{ dept.mobile || '-' }}</td>
              <td>{{ dept.email || '-' }}</td>
              <td>
                <span class="status-tag" :class="dept.status === '1' ? 'success' : 'danger'">
                  {{ formatStatus(dept.status) }}
                </span>
              </td>
              <td>
                <div class="table-actions">
                  <button class="action-btn" @click="openAddModal(dept.id)">新增</button>
                  <button class="action-btn" @click="openEditModal(dept)">编辑</button>
                  <button class="action-btn danger" @click="handleDelete(dept)">删除</button>
                </div>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>

    <!-- 弹窗 -->
    <div v-if="modalVisible" class="modal-mask" @click.self="modalVisible = false">
      <div class="modal-container">
        <div class="modal-header">
          <h3>{{ isEdit ? '编辑部门' : '新增部门' }}</h3>
          <button class="modal-close" @click="modalVisible = false">&times;</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>上级部门</label>
            <select v-model="formData.parentId" class="form-select">
              <option :value="0">顶级部门</option>
              <option v-for="opt in parentDeptOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
            </select>
          </div>
          <div class="form-group">
            <label>部门名称 <span class="required">*</span></label>
            <input v-model="formData.name" placeholder="请输入部门名称" class="form-input" />
          </div>
          <div class="form-group">
            <label>显示顺序</label>
            <input v-model.number="formData.orderNum" type="number" min="0" placeholder="请输入显示顺序" class="form-input" />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>负责人</label>
              <input v-model="formData.leader" placeholder="请输入负责人" class="form-input" />
            </div>
            <div class="form-group">
              <label>联系电话</label>
              <input v-model="formData.mobile" placeholder="请输入联系电话" class="form-input" />
            </div>
          </div>
          <div class="form-group">
            <label>邮箱</label>
            <input v-model="formData.email" placeholder="请输入邮箱" class="form-input" />
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
          <button class="btn btn-primary" @click="handleSubmit" :disabled="modalLoading">
            {{ modalLoading ? '保存中...' : '确定' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.dept-page {
  animation: fadeIn 0.4s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

.page-header {
  margin-bottom: 24px;

  h1 {
    font-size: 22px;
    font-weight: 600;
    color: #1a1a1a;
    margin: 0 0 4px;
  }

  p {
    font-size: 14px;
    color: #666;
    margin: 0;
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
      padding: 12px 16px;
      border-bottom: 1px solid #f5f5f5;
    }
  }
}

.tree-indent {
  color: #999;
  margin-right: 4px;
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

/* 按钮样式 */
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

/* 表单样式 */
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

.form-input,
.form-select {
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

.modal-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid #f0f0f0;
}
</style>
