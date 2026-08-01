<script setup lang="ts">
import { useRolePage } from '@/hooks/system/useRolePage'
import { ENTITY_STATUS, PAGE_SIZE_OPTIONS } from '@/constants'
import DataTable, { type DataTableColumn } from '@/components/DataTable.vue'

const roleColumns: DataTableColumn[] = [
  { key: 'roleName', title: '角色名称', width: '160px' },
  { key: 'roleCode', title: '权限字符', width: '140px' },
  { key: 'roleDesc', title: '角色描述', width: 'auto' },
  { key: 'status', title: '状态', width: '100px' },
  { key: 'createTime', title: '创建时间', width: '180px' },
  { key: 'action', title: '操作', width: '240px' },
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
  statusOptions,
  handleSearch,
  handleReset,
  openAddModal,
  openEditModal,
  handleSubmit,
  handleDelete,
  userModalVisible,
  userModalLoading,
  userLoading,
  allUsers,
  selectedUserIds,
  openAssignUsersModal,
  handleAssignUsers,
  menuModalVisible,
  menuModalLoading,
  menuLoading,
  menuTree,
  menuExpandedKeys,
  selectedMenuIds,
  openAssignMenusModal,
  handleAssignMenus,
  formatStatus,
  handlePageSizeChange,
  closeModal,
  closeUserModal,
  closeMenuModal,
  onPageChange,
} = useRolePage()
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
            <option :value="''">全部</option>
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
      <button class="btn btn-primary" v-has-permi="'sys:role:add'" @click="openAddModal">新增</button>
    </div>

    <!-- 表格 -->
    <DataTable
      :columns="roleColumns"
      :data="dataSource"
      :loading="loading"
      :total="pagination.total"
      :page-size="pagination.pageSize"
      :current="pagination.current"
      :page-size-options="[...PAGE_SIZE_OPTIONS]"
      row-key="id"
      @page-change="onPageChange"
      @page-size-change="handlePageSizeChange"
    >
      <template #cell-roleName="{ row }">{{ row.roleName }}</template>
      <template #cell-roleCode="{ row }">{{ row.roleCode }}</template>
      <template #cell-roleDesc="{ row }">{{ row.roleDesc || '-' }}</template>
      <template #cell-status="{ row }">
        <span class="status-tag" :class="row.status === ENTITY_STATUS.ACTIVE ? 'success' : 'danger'">
          {{ formatStatus(row.status) }}
        </span>
      </template>
      <template #cell-createTime="{ row }">{{ row.createTime }}</template>
      <template #cell-action="{ row }">
        <div class="table-actions">
          <button class="action-btn" v-has-permi="'sys:role:edit'" @click="openEditModal(row)">编辑</button>
          <button class="action-btn" v-has-permi="'sys:role:assign_users'" @click="openAssignUsersModal(row.id)">分配用户</button>
          <button class="action-btn" v-has-permi="'sys:role:assign_menus'" @click="openAssignMenusModal(row.id)">分配权限</button>
          <button class="action-btn danger" v-has-permi="'sys:role:delete'" @click="handleDelete(row)">删除</button>
        </div>
      </template>
    </DataTable>

    <!-- 新增/编辑弹窗 -->
    <div v-if="modalVisible" class="modal-mask" @click.self="closeModal">
      <div class="modal-container">
        <div class="modal-header">
          <h3>{{ isEdit ? '编辑角色' : '新增角色' }}</h3>
          <button class="modal-close" @click="closeModal">&times;</button>
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
          <button class="btn btn-default" @click="closeModal">取消</button>
          <button class="btn btn-primary" @click="handleSubmit" :disabled="modalLoading">{{ modalLoading ? '保存中...' : '确定' }}</button>
        </div>
      </div>
    </div>

    <!-- 分配用户弹窗 -->
    <div v-if="userModalVisible" class="modal-mask" @click.self="closeUserModal">
      <div class="modal-container" style="width: 600px;">
        <div class="modal-header">
          <h3>分配用户</h3>
          <button class="modal-close" @click="closeUserModal">&times;</button>
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
          <button class="btn btn-default" @click="closeUserModal">取消</button>
          <button class="btn btn-primary" @click="handleAssignUsers" :disabled="userModalLoading">{{ userModalLoading ? '保存中...' : '确定' }}</button>
        </div>
      </div>
    </div>

    <!-- 分配菜单弹窗 -->
    <div v-if="menuModalVisible" class="modal-mask" @click.self="closeMenuModal">
      <div class="modal-container" style="width: 500px;">
        <div class="modal-header">
          <h3>分配菜单权限</h3>
          <button class="modal-close" @click="closeMenuModal">&times;</button>
        </div>
        <div class="modal-body">
          <div v-if="menuLoading" class="loading-text">加载中...</div>
          <div v-else class="menu-tree">
            <a-tree
              v-model:checked-keys="selectedMenuIds"
              v-model:expanded-keys="menuExpandedKeys"
              :data="menuTree"
              :field-names="{ key: 'id', title: 'menuName', children: 'children' }"
              checkable
              block-node
            />
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-default" @click="closeMenuModal">取消</button>
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

/* .search-section / .search-form / .form-item / .search-input / .search-select /
   .form-actions / .btn / .btn-primary / .btn-default / .toolbar / .toolbar-title
   已迁移到 global.scss 复用，role / user / workflow 各页直接用 */

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
}

.radio-group {
  display: flex;
  gap: var(--space-md);
  padding-top: 6px;
}

.radio-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--text-secondary);
  cursor: pointer;

  input[type="radio"] { accent-color: var(--color-primary); }
}

.user-list {
  max-height: 400px;
  overflow-y: auto;
}

.user-item {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: 8px 12px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  &:hover { background: var(--bg-primary); }

  input[type="checkbox"] { accent-color: var(--color-primary); }
}

.menu-tree {
  max-height: 400px;
  overflow-y: auto;
}
</style>
