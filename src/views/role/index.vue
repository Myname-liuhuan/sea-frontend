<script setup lang="ts">
import { useRolePage } from '@/hooks/useRolePage'
import { ENTITY_STATUS, PAGE_SIZE_OPTIONS } from '@/constants'

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
  totalPages,
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
              <span class="status-tag" :class="row.status === ENTITY_STATUS.ACTIVE ? 'success' : 'danger'">
                {{ formatStatus(row.status) }}
              </span>
            </td>
            <td>{{ row.createTime }}</td>
            <td>
              <div class="table-actions">
                <button class="action-btn" v-has-permi="'sys:role:edit'" @click="openEditModal(row)">编辑</button>
                <button class="action-btn" v-has-permi="'sys:role:assign_users'" @click="openAssignUsersModal(row.id)">分配用户</button>
                <button class="action-btn" v-has-permi="'sys:role:assign_menus'" @click="openAssignMenusModal(row.id)">分配权限</button>
                <button class="action-btn danger" v-has-permi="'sys:role:delete'" @click="handleDelete(row)">删除</button>
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
        <select :value="pagination.pageSize" @change="handlePageSizeChange" class="page-size-select">
          <option v-for="size in PAGE_SIZE_OPTIONS" :key="size" :value="size">{{ size }} 条/页</option>
        </select>
        <button :disabled="pagination.current === 1" @click="onPageChange(pagination.current - 1)">上一页</button>
        <button :disabled="pagination.current >= totalPages" @click="onPageChange(pagination.current + 1)">下一页</button>
      </div>
    </div>

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

.search-input, .search-select {
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

.search-input { width: 160px; }
.search-select { width: 120px; }

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
  border: none;
  transition: all var(--transition-base);
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

.table-wrapper {
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-light);
  overflow: hidden;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;

  thead {
    background: var(--bg-primary);
    th {
      text-align: left;
      padding: 14px 16px;
      font-weight: 600;
      color: var(--text-secondary);
      border-bottom: 1px solid var(--border-light);
      &:last-child { text-align: center; }
    }
  }

  tbody tr {
    &:hover { background: var(--bg-primary); }
    td {
      padding: 14px 16px;
      border-bottom: 1px solid var(--border-light);
    }
  }
}

.status-tag {
  display: inline-block;
  padding: 2px 8px;
  font-size: 12px;
  font-weight: 500;
  border-radius: var(--radius-sm);

  &.success {
    background: #f6ffed;
    color: var(--color-success);
    border: 1px solid #b7eb8f;
  }
  &.danger {
    background: #fff1f0;
    color: var(--color-danger);
    border: 1px solid #ffccc7;
  }
}

.table-actions {
  display: flex;
  justify-content: center;
  gap: 4px;
  width: 100%;
}

.action-btn {
  display: inline-block;
  padding: 4px 8px;
  font-size: 12px;
  color: var(--color-info);
  background: none;
  border: none;
  cursor: pointer;
  border-radius: var(--radius-sm);
  &:hover { background: #e6f7ff; }
  &.danger { color: var(--color-danger); &:hover { background: #fff1f0; } }
}

.empty-state, .loading-text {
  text-align: center;
  padding: 48px 16px;
  color: var(--text-tertiary);
  font-size: 13px;
}

.pagination-wrapper {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-md) 0;
}

.pagination-info { font-size: 13px; color: var(--text-secondary); }

.pagination-controls {
  display: flex;
  align-items: center;
  gap: var(--space-sm);

  button {
    height: 32px;
    padding: 0 12px;
    font-size: 13px;
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-sm);
    cursor: pointer;
    &:hover:not(:disabled) { background: var(--bg-primary); }
    &:disabled { opacity: 0.5; cursor: not-allowed; }
  }
}

.page-size-select {
  height: 32px;
  padding: 0 8px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  font-size: 13px;
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
