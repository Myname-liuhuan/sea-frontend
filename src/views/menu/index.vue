<script setup lang="ts">
import { useMenuPage } from '@/hooks/useMenuPage'
import { MENU_TYPE } from '@/constants'

const {
  loading,
  menuTree,
  expandedKeys,
  modalVisible,
  modalLoading,
  isEdit,
  formData,
  menuTypeOptions,
  statusOptions,
  menuOptions,
  openAddModal,
  openEditModal,
  handleSubmit,
  handleDelete,
  formatMenuType,
  formatVisible,
} = useMenuPage()
</script>

<template>
  <div class="menu-page">
    <div class="page-header">
      <div class="page-title">
        <h1>菜单管理</h1>
        <p>配置系统菜单和权限</p>
      </div>
      <button class="btn btn-primary" v-has-permi="'sys:menu:add'" @click="openAddModal(0)">
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
          :field-names="{ key: 'id', title: 'menuName', children: 'children' }"
          block-node
        >
          <template #title="slotProps">
            <div class="menu-item">
              <div class="menu-info">
                <span class="menu-name">{{ slotProps.menuName }}</span>
                <span class="menu-type-tag" :class="'type-' + slotProps.menuType">
                  {{ formatMenuType(slotProps.menuType) }}
                </span>
              </div>
              <div class="menu-meta">
                <span class="menu-path">{{ slotProps.path || '-' }}</span>
                <span class="menu-perms" v-if="slotProps.perms">{{ slotProps.perms }}</span>
                <span class="menu-status" :class="slotProps.visible === '0' ? 'show' : 'hide'">
                  {{ formatVisible(slotProps.visible) }}
                </span>
              </div>
              <div class="menu-actions">
                <button v-if="slotProps.menuType !== MENU_TYPE.BUTTON" v-has-permi="'sys:menu:add'" class="action-btn" @click.stop="openAddModal(slotProps.id)">新增</button>
                <button class="action-btn" v-has-permi="'sys:menu:edit'" @click.stop="openEditModal(slotProps)">编辑</button>
                <button class="action-btn danger" v-has-permi="'sys:menu:delete'" @click.stop="handleDelete(slotProps)">删除</button>
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

          <div v-if="formData.menuType !== MENU_TYPE.BUTTON" class="form-group">
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

          <div v-if="formData.menuType !== MENU_TYPE.BUTTON" class="form-group">
            <label>图标</label>
            <IconPicker v-model="formData.icon" />
          </div>

          <div v-if="formData.menuType !== MENU_TYPE.BUTTON" class="form-group">
            <label>路由地址 <span class="required">*</span></label>
            <input v-model="formData.path" placeholder="请输入路由地址" class="form-input" />
          </div>

          <div v-if="formData.menuType === MENU_TYPE.MENU" class="form-group">
            <label>组件路径</label>
            <input v-model="formData.component" placeholder="如: system/user/index" class="form-input" />
          </div>

          <div v-if="formData.menuType === MENU_TYPE.BUTTON" class="form-group">
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

<script lang="ts">
import IconPicker from '@/components/IconPicker.vue'
export default { components: { IconPicker } }
</script>

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
  margin-bottom: var(--space-lg);

  h1 {
    font-size: 24px;
    font-weight: 600;
    color: var(--text-primary);
    margin: 0 0 8px;
  }

  p {
    font-size: 14px;
    color: var(--text-secondary);
    margin: 0;
  }
}

.btn {
  height: 36px;
  padding: 0 16px;
  font-size: 13px;
  font-weight: 500;
  border-radius: var(--radius-sm);
  cursor: pointer;
  border: none;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all var(--transition-base);

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

.menu-container {
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-light);
  padding: var(--space-lg);
}

.loading-state, .empty-state {
  text-align: center;
  padding: var(--space-2xl);
  color: var(--text-tertiary);

  .loading-spinner {
    width: 24px;
    height: 24px;
    border: 2px solid var(--border-light);
    border-top-color: var(--color-primary);
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
  gap: var(--space-lg);
  padding: 8px 0;
}

.menu-info {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  min-width: 200px;
}

.menu-name {
  font-weight: 500;
  color: var(--text-primary);
}

.menu-type-tag {
  font-size: 11px;
  padding: 2px 6px;
  border-radius: var(--radius-sm);
  font-weight: 500;

  &.type-1 { background: #f6ffed; color: var(--color-success); }
  &.type-2 { background: #fff7e6; color: #fa8c16; }
}

.menu-meta {
  flex: 1;
  display: flex;
  align-items: center;
  gap: var(--space-md);
  font-size: 12px;
  color: var(--text-tertiary);
}

.menu-path, .menu-perms {
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.menu-status {
  &.show { color: var(--color-success); }
  &.hide { color: var(--color-danger); }
}

.menu-actions {
  display: flex;
  gap: 4px;
  justify-content: center;
  opacity: 0;
  transition: opacity var(--transition-base);

  .menu-item:hover & {
    opacity: 1;
  }
}

.action-btn {
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
</style>
