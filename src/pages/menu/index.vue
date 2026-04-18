<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import { getAllMenuTree, getMenuOptions, addMenu, updateMenu, deleteMenu } from '@/api/menu'
import type { SysMenu, SysMenuDTO } from '@/types'
import { Message, Modal } from '@arco-design/web-vue'
import IconPicker from '@/components/IconPicker.vue'

const loading = ref(false)
const menuTree = ref<SysMenu[]>([])
const expandedKeys = ref<number[]>([])

const modalVisible = ref(false)
const modalLoading = ref(false)
const isEdit = ref(false)
const formRef = ref()

const formData = reactive<SysMenuDTO>({
  menuName: '',
  parentId: 0,
  path: '',
  component: '',
  menuType: 1,
  visible: 0,
  status: 1,
  perms: '',
  icon: '',
  orderNum: 0,
})

const menuTypeOptions = [
  { label: '目录', value: 0 },
  { label: '菜单', value: 1 },
  { label: '按钮', value: 2 },
]

const statusOptions = [
  { label: '显示', value: 0 },
  { label: '隐藏', value: 1 },
]

const menuOptions = ref<SysMenu[]>([])

async function fetchMenuTree() {
  loading.value = true
  try {
    const res = await getAllMenuTree()
    if (res.code === 200) {
      menuTree.value = res.data
      expandedKeys.value = res.data.map((m) => m.menuId)
    }
  } finally {
    loading.value = false
  }
}

async function loadMenuOptions() {
  const res = await getMenuOptions()
  if (res.code === 200) {
    menuOptions.value = [{ menuId: 0, menuName: '顶级菜单', parentId: 0, path: '', menuType: 0, visible: 0, status: 1, orderNum: 0 }, ...res.data]
  }
}

function formatMenuType(type: number) {
  return menuTypeOptions.find((t) => t.value === type)?.label || ''
}

function formatStatus(status: number) {
  return status === 0 ? '显示' : '隐藏'
}

function openAddModal(parentId = 0) {
  isEdit.value = false
  Object.assign(formData, {
    menuId: undefined,
    menuName: '',
    parentId,
    path: '',
    component: '',
    menuType: 1,
    visible: 0,
    status: 1,
    perms: '',
    icon: '',
    orderNum: 0,
  })
  loadMenuOptions()
  modalVisible.value = true
}

function openEditModal(row: SysMenu) {
  isEdit.value = true
  Object.assign(formData, {
    menuId: row.menuId,
    menuName: row.menuName,
    parentId: row.parentId,
    path: row.path,
    component: row.component || '',
    menuType: row.menuType,
    visible: row.visible,
    status: row.status,
    perms: row.perms || '',
    icon: row.icon || '',
    orderNum: row.orderNum,
  })
  loadMenuOptions()
  modalVisible.value = true
}

async function handleSubmit() {
  modalLoading.value = true
  try {
    const api = isEdit.value ? updateMenu : addMenu
    const res = await api(formData)
    if (res.code === 200) {
      Message.success(isEdit.value ? '修改成功' : '新增成功')
      modalVisible.value = false
      fetchMenuTree()
    }
  } finally {
    modalLoading.value = false
  }
}

function handleDelete(row: SysMenu) {
  if (row.children && row.children.length > 0) {
    Message.warning('该菜单下存在子菜单，请先删除子菜单')
    return
  }

  Modal.warning({
    title: '确认删除',
    content: `确定要删除菜单 "${row.menuName}" 吗？`,
    okText: '确定',
    cancelText: '取消',
    async onOk() {
      const res = await deleteMenu(row.menuId)
      if (res.code === 200) {
        Message.success('删除成功')
        fetchMenuTree()
      }
    },
  })
}

onMounted(() => {
  fetchMenuTree()
})
</script>

<template>
  <div class="menu-page">
    <div class="page-header">
      <div class="page-title">
        <h1>菜单管理</h1>
        <p>配置系统菜单和权限</p>
      </div>
      <button class="btn btn-primary" @click="openAddModal(0)">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="12" y1="5" x2="12" y2="19"/>
          <line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        新增
      </button>
    </div>

    <div class="menu-container">
      <div v-if="loading" class="loading-state">
        <div class="loading-spinner"></div>
        <p>加载中...</p>
      </div>

      <div v-else-if="!menuTree.length" class="empty-state">
        <p>暂无菜单数据</p>
      </div>

      <div v-else class="menu-tree">
        <a-tree
          v-model:expanded-keys="expandedKeys"
          :data="menuTree"
          :field-names="{ key: 'menuId', title: 'menuName', children: 'children' }"
          block-node
        >
          <template #title="{ data }">
            <div class="menu-item">
              <div class="menu-info">
                <span class="menu-icon" v-if="data.icon">
                  <component :is="data.icon" />
                </span>
                <span class="menu-name">{{ data.menuName }}</span>
                <span class="menu-type-tag" :class="data.menuType">
                  {{ formatMenuType(data.menuType) }}
                </span>
              </div>
              <div class="menu-meta">
                <span class="menu-path">{{ data.path || '-' }}</span>
                <span class="menu-perms" v-if="data.perms">{{ data.perms }}</span>
                <span class="menu-status" :class="data.status === 0 ? 'show' : 'hide'">
                  {{ formatStatus(data.status) }}
                </span>
              </div>
              <div class="menu-actions">
                <button class="action-btn" @click.stop="openAddModal(data.menuId)">新增</button>
                <button class="action-btn" @click.stop="openEditModal(data)">编辑</button>
                <button class="action-btn danger" @click.stop="handleDelete(data)">删除</button>
              </div>
            </div>
          </template>
        </a-tree>
      </div>
    </div>

    <!-- 弹窗 -->
    <div v-if="modalVisible" class="modal-mask" @click.self="modalVisible = false">
      <div class="modal-container" style="width: 600px;">
        <div class="modal-header">
          <h3>{{ isEdit ? '编辑菜单' : '新增菜单' }}</h3>
          <button class="modal-close" @click="modalVisible = false">&times;</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>菜单类型</label>
            <div class="radio-group">
              <label v-for="opt in menuTypeOptions" :key="opt.value" class="radio-item">
                <input type="radio" :value="opt.value" v-model="formData.menuType" />
                <span>{{ opt.label }}</span>
              </label>
            </div>
          </div>

          <div v-if="formData.menuType !== 2" class="form-group">
            <label>上级菜单</label>
            <select v-model="formData.parentId" class="form-select">
              <option :value="0">顶级菜单</option>
              <option v-for="opt in menuOptions" :key="opt.menuId" :value="opt.menuId">
                {{ opt.menuName }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label>菜单名称 <span class="required">*</span></label>
            <input v-model="formData.menuName" placeholder="请输入菜单名称" class="form-input" />
          </div>

          <div v-if="formData.menuType !== 2" class="form-group">
            <label>图标</label>
            <IconPicker v-model="formData.icon" />
          </div>

          <div v-if="formData.menuType !== 2" class="form-group">
            <label>路由地址 <span class="required">*</span></label>
            <input v-model="formData.path" placeholder="请输入路由地址" class="form-input" />
          </div>

          <div v-if="formData.menuType === 1" class="form-group">
            <label>组件路径</label>
            <input v-model="formData.component" placeholder="如: system/user/index" class="form-input" />
          </div>

          <div v-if="formData.menuType === 2" class="form-group">
            <label>权限标识 <span class="required">*</span></label>
            <input v-model="formData.perms" placeholder="如: system:user:list" class="form-input" />
          </div>

          <div class="form-group">
            <label>排序</label>
            <input v-model.number="formData.orderNum" type="number" placeholder="请输入排序" class="form-input" />
          </div>

          <div class="form-group">
            <label>状态</label>
            <div class="radio-group">
              <label v-for="opt in statusOptions" :key="opt.value" class="radio-item">
                <input type="radio" :value="opt.value" v-model="formData.visible" />
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
.menu-page {
  animation: fadeIn 0.4s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;

  h1 {
    font-size: 24px;
    font-weight: 600;
    color: #1a1a1a;
    margin: 0 0 8px;
  }

  p {
    font-size: 14px;
    color: #666;
    margin: 0;
  }
}

.btn {
  height: 36px;
  padding: 0 16px;
  font-size: 13px;
  font-weight: 500;
  border-radius: 6px;
  cursor: pointer;
  border: none;
  display: flex;
  align-items: center;
  gap: 6px;
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
  &:hover:not(:disabled) { background: #333; }
}

.btn-default {
  background: #fff;
  color: #333;
  border: 1px solid #e8e8e8;
  &:hover { background: #fafafa; }
}

.menu-container {
  background: #fff;
  border-radius: 12px;
  border: 1px solid #f0f0f0;
  padding: 24px;
}

.loading-state, .empty-state {
  text-align: center;
  padding: 48px;
  color: #999;

  .loading-spinner {
    width: 24px;
    height: 24px;
    border: 2px solid #f0f0f0;
    border-top-color: #1a1a1a;
    border-radius: 50%;
    margin: 0 auto 12px;
    animation: spin 0.8s linear infinite;
  }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 8px 0;
}

.menu-info {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 200px;
}

.menu-icon {
  width: 18px;
  height: 18px;
  color: #666;
}

.menu-name {
  font-weight: 500;
  color: #1a1a1a;
}

.menu-type-tag {
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 500;

  &.0 {
    background: #e6f7ff;
    color: #1890ff;
  }
  &.1 {
    background: #f6ffed;
    color: #52c41a;
  }
  &.2 {
    background: #fff7e6;
    color: #fa8c16;
  }
}

.menu-meta {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 12px;
  color: #999;
}

.menu-path, .menu-perms {
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.menu-status {
  &.show { color: #52c41a; }
  &.hide { color: #ff4d4f; }
}

.menu-actions {
  display: flex;
  gap: 8px;
  opacity: 0;
  transition: opacity 0.2s;

  .menu-item:hover & {
    opacity: 1;
  }
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

.form-input, .form-select {
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
</style>