import { reactive, ref, computed } from 'vue'
import { useTable } from '@/hooks/useTable'
import {
  getRoleList,
  addRole,
  updateRole,
  assignUsers,
  assignMenus,
  getRoleMenuIds,
  getRoleUserIds,
} from '@/api/role'
import { getAllMenuTree } from '@/api/menu'
import { getUserPage } from '@/api/user'
import type {
  SysRole,
  SysRoleQuery,
  SysRoleDTO,
  SysUser,
  TreeNodeDisplay,
} from '@/types'
import { Message, Modal } from '@arco-design/web-vue'
import { removeIconField } from '@/utils/tree'
import { formatEntityStatus } from '@/utils/format'
import { RESPONSE_CODE, ENTITY_STATUS } from '@/constants'

interface SearchForm {
  roleName: string
  roleCode: string
  status: string
}

interface UserOption {
  id: string
  username: string
}

const STATUS_OPTIONS = [
  { label: formatEntityStatus(ENTITY_STATUS.ACTIVE), value: ENTITY_STATUS.ACTIVE },
  { label: formatEntityStatus(ENTITY_STATUS.DISABLED), value: ENTITY_STATUS.DISABLED },
]

const DEFAULT_FORM: SysRoleDTO = {
  roleName: '',
  roleCode: '',
  roleDesc: '',
  status: ENTITY_STATUS.ACTIVE,
}

export function useRolePage() {
  const searchForm = reactive<SearchForm>({
    roleName: '',
    roleCode: '',
    status: '',
  })

  const { loading, dataSource, pagination, fetchData, onPageChange } = useTable<SysRole, SysRoleQuery>({
    api: (params) => getRoleList(params).then((res) => res.data),
  })

  const modalVisible = ref(false)
  const modalLoading = ref(false)
  const isEdit = ref(false)
  const formData = reactive<SysRoleDTO>({ ...DEFAULT_FORM })
  const formRef = ref()

  const totalPages = computed(() => Math.ceil(pagination.total / pagination.pageSize))

  function handleSearch() {
    fetchData({ ...searchForm } as Partial<SysRoleQuery>)
  }

  function handleReset() {
    searchForm.roleName = ''
    searchForm.roleCode = ''
    searchForm.status = ''
    fetchData()
  }

  function openAddModal() {
    isEdit.value = false
    Object.assign(formData, DEFAULT_FORM)
    modalVisible.value = true
  }

  function openEditModal(record: SysRole) {
    isEdit.value = true
    Object.assign(formData, {
      id: record.id,
      roleName: record.roleName,
      roleCode: record.roleCode,
      roleDesc: record.roleDesc ?? '',
      status: record.status,
    })
    modalVisible.value = true
  }

  async function handleSubmit() {
    const valid = await formRef.value?.validate()
    if (valid) return

    modalLoading.value = true
    try {
      const res = isEdit.value ? await updateRole(formData) : await addRole(formData)
      if (res.code === RESPONSE_CODE.SUCCESS) {
        Message.success(isEdit.value ? '修改成功' : '新增成功')
        closeModal()
        fetchData()
      }
    } finally {
      modalLoading.value = false
    }
  }

  function handleDelete(record: SysRole) {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除角色「${record.roleName}」吗？`,
      onOk: async () => {
        const res = await updateRole({
          ...record,
          id: record.id,
          status: ENTITY_STATUS.DISABLED,
        })
        if (res.code === RESPONSE_CODE.SUCCESS) {
          Message.success('删除成功')
          fetchData()
        }
      },
    })
  }

  function closeModal() {
    modalVisible.value = false
    Object.assign(formData, DEFAULT_FORM)
  }

  function handlePageSizeChange(event: Event) {
    const target = event.target as HTMLSelectElement
    const size = Number(target.value)
    if (size > 0) {
      pagination.pageSize = size
      pagination.current = 1
      fetchData()
    }
  }

  // ========== 用户分配 ==========

  const userModalVisible = ref(false)
  const userModalLoading = ref(false)
  const userLoading = ref(false)
  const allUsers = ref<UserOption[]>([])
  const selectedUserIds = ref<string[]>([])
  let currentRoleIdForUser = 0

  async function openAssignUsersModal(roleId: number) {
    currentRoleIdForUser = roleId
    userModalVisible.value = true
    userLoading.value = true
    try {
      const [usersRes, assignedRes] = await Promise.all([
        getUserPage({ pageNum: 1, pageSize: 9999 }),
        getRoleUserIds(roleId),
      ])
      allUsers.value = usersRes.data.rows.map((user: SysUser) => ({
        id: String(user.id),
        username: user.username,
      }))
      selectedUserIds.value = assignedRes.data ?? []
    } finally {
      userLoading.value = false
    }
  }

  async function handleAssignUsers() {
    userModalLoading.value = true
    try {
      const res = await assignUsers({
        roleId: currentRoleIdForUser,
        userIds: selectedUserIds.value,
      })
      if (res.code === RESPONSE_CODE.SUCCESS) {
        Message.success('分配用户成功')
        closeUserModal()
      }
    } finally {
      userModalLoading.value = false
    }
  }

  function closeUserModal() {
    userModalVisible.value = false
    selectedUserIds.value = []
    allUsers.value = []
  }

  // ========== 菜单分配 ==========

  const menuModalVisible = ref(false)
  const menuModalLoading = ref(false)
  const menuLoading = ref(false)
  const menuTree = ref<TreeNodeDisplay[]>([])
  const menuExpandedKeys = ref<string[]>([])
  const selectedMenuIds = ref<string[]>([])
  let currentRoleIdForMenu = 0

  async function openAssignMenusModal(roleId: number) {
    currentRoleIdForMenu = roleId
    menuModalVisible.value = true
    menuLoading.value = true
    try {
      const [menuRes, assignedRes] = await Promise.all([
        getAllMenuTree(),
        getRoleMenuIds(roleId),
      ])
      menuTree.value = (menuRes.data ?? []).map(removeIconField)
      selectedMenuIds.value = assignedRes.data ?? []
      menuExpandedKeys.value = menuTree.value.map((node) => node.id)
    } finally {
      menuLoading.value = false
    }
  }

  async function handleAssignMenus() {
    menuModalLoading.value = true
    try {
      const res = await assignMenus({
        roleId: currentRoleIdForMenu,
        menuIds: selectedMenuIds.value,
      })
      if (res.code === RESPONSE_CODE.SUCCESS) {
        Message.success('分配菜单成功')
        closeMenuModal()
      }
    } finally {
      menuModalLoading.value = false
    }
  }

  function closeMenuModal() {
    menuModalVisible.value = false
    selectedMenuIds.value = []
    menuTree.value = []
    menuExpandedKeys.value = []
  }

  return {
    searchForm,
    loading,
    dataSource,
    pagination,
    modalVisible,
    modalLoading,
    isEdit,
    formData,
    formRef,
    statusOptions: STATUS_OPTIONS,
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
    formatStatus: formatEntityStatus,
    totalPages,
    handlePageSizeChange,
    closeModal,
    closeUserModal,
    closeMenuModal,
    fetchData,
    onPageChange,
  }
}
