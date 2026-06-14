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
  &:hover { background: #e6f7ff; }
  &.danger { color: #ff4d4f; &:hover { background: #fff1f0; } }
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

  input[type="radio"] { accent-color: #1a1a1a; }
}
</style>
