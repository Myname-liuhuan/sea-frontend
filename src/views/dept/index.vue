<script setup lang="ts">
import { useDeptPage } from '@/hooks/useDeptPage'
import { ENTITY_STATUS } from '@/constants'

const {
  loading,
  treeData,
  modalVisible,
  modalLoading,
  isEdit,
  formData,
  parentDeptOptions,
  statusOptions,
  openAddModal,
  openEditModal,
  handleSubmit,
  handleDelete,
  formatStatus,
  flatData,
  closeModal,
} = useDeptPage()
</script>

<template>
  <div class="dept-page">
    <div class="page-header">
      <h1>部门管理</h1>
      <p>管理部门组织架构</p>
    </div>

    <div class="toolbar">
      <div class="toolbar-title">
        <span class="title">部门列表</span>
        <span class="count">{{ treeData.length }} 个部门</span>
      </div>
      <button class="btn btn-primary" v-has-permi="'sys:dept:add'" @click="openAddModal(0)">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="12" y1="5" x2="12" y2="19"/>
          <line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        新增
      </button>
    </div>

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
          <tr v-if="loading" class="loading-row">
            <td colspan="7">
              <div class="loading-text">加载中...</div>
            </td>
          </tr>
          <tr v-else-if="!treeData.length" class="empty-row">
            <td colspan="7">
              <div class="empty-state">暂无数据</div>
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
                <span class="status-tag" :class="dept.status === ENTITY_STATUS.ACTIVE ? 'success' : 'danger'">
                  {{ formatStatus(dept.status) }}
                </span>
              </td>
              <td>
                <div class="table-actions">
                  <button class="action-btn" v-has-permi="'sys:dept:add'" @click="openAddModal(dept.id)">新增</button>
                  <button class="action-btn" v-has-permi="'sys:dept:edit'" @click="openEditModal(dept)">编辑</button>
                  <button class="action-btn danger" v-has-permi="'sys:dept:delete'" @click="handleDelete(dept)">删除</button>
                </div>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>

    <!-- 弹窗 -->
    <div v-if="modalVisible" class="modal-mask" @click.self="closeModal">
      <div class="modal-container">
        <div class="modal-header">
          <h3>{{ isEdit ? '编辑部门' : '新增部门' }}</h3>
          <button class="modal-close" @click="closeModal">&times;</button>
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
.dept-page {
  animation: fadeIn 0.4s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

.page-header {
  margin-bottom: var(--space-lg);

  h1 {
    font-size: 22px;
    font-weight: 600;
    color: var(--text-primary);
    margin: 0 0 4px;
  }

  p {
    font-size: 14px;
    color: var(--text-secondary);
    margin: 0;
  }
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
      padding: 12px 16px;
      border-bottom: 1px solid var(--border-light);
    }
  }
}

.tree-indent {
  color: var(--text-tertiary);
  margin-right: 4px;
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

.form-input, .form-select {
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

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-md);
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
  color: var(--color-primary-light);
  cursor: pointer;

  input[type="radio"] { accent-color: var(--color-primary); }
}

.loading-row td, .empty-row td {
  text-align: center;
  padding: 48px 16px;
}

.loading-text, .empty-state {
  color: var(--text-tertiary);
  font-size: 13px;
}
</style>
