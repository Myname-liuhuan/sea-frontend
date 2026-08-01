import { ref, reactive, onMounted } from 'vue'
import { Message, Modal } from '@arco-design/web-vue'
import { getDeptTree, addDept, updateDept, deleteDept, getDeptTreeSelect } from '@/api/system/dept'
import type { SysDept, SysDeptDTO } from '@/types/system'
import { RESPONSE_CODE, ENTITY_STATUS } from '@/constants'
import { formatEntityStatus } from '@/utils/format'

interface DeptOption {
  label: string
  value: number
}

export interface FlatDeptItem {
  dept: SysDept
  level: number
  // index signature 让 DataTable<T extends Record<string, unknown>> 泛型约束通过
  [key: string]: unknown
}

export function useDeptPage() {
  const loading = ref(false)
  const treeData = ref<SysDept[]>([])

  const modalVisible = ref(false)
  const modalLoading = ref(false)
  const isEdit = ref(false)

  const formData = reactive<SysDeptDTO>({
    id: undefined,
    parentId: 0,
    name: '',
    orderNum: 0,
    leader: '',
    mobile: '',
    email: '',
    status: ENTITY_STATUS.ACTIVE,
  })

  const parentDeptOptions = ref<DeptOption[]>([])

  const statusOptions = [
    { label: '正常', value: ENTITY_STATUS.ACTIVE },
    { label: '停用', value: ENTITY_STATUS.DISABLED },
  ]

  async function fetchData() {
    loading.value = true
    try {
      const res = await getDeptTree()
      if (res.code === RESPONSE_CODE.SUCCESS) {
        treeData.value = res.data || []
      }
    } finally {
      loading.value = false
    }
  }

  async function loadParentDeptOptions() {
    const res = await getDeptTreeSelect()
    if (res.code === RESPONSE_CODE.SUCCESS) {
      parentDeptOptions.value = convertToOptions(res.data || [])
    }
  }

  function convertToOptions(depts: SysDept[], level = 0): DeptOption[] {
    const result: DeptOption[] = []
    for (const dept of depts) {
      result.push({ label: '　'.repeat(level) + dept.name, value: dept.id })
      if (dept.children) {
        result.push(...convertToOptions(dept.children, level + 1))
      }
    }
    return result
  }

  function resetFormData(parentId = 0) {
    Object.assign(formData, {
      id: undefined,
      parentId,
      name: '',
      orderNum: 0,
      leader: '',
      mobile: '',
      email: '',
      status: ENTITY_STATUS.ACTIVE,
    })
  }

  function openAddModal(parentId = 0) {
    isEdit.value = false
    resetFormData(parentId)
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
    modalVisible.value = true
  }

  async function handleSubmit() {
    modalLoading.value = true
    try {
      const api = isEdit.value ? updateDept : addDept
      const res = await api(formData)
      if (res.code === RESPONSE_CODE.SUCCESS) {
        Message.success(isEdit.value ? '修改成功' : '新增成功')
        closeModal()
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
        if (res.code === RESPONSE_CODE.SUCCESS) {
          Message.success('删除成功')
          fetchData()
        } else {
          Message.error(res.message || '删除失败')
        }
      },
    })
  }

  function formatStatus(status: string): string {
    return formatEntityStatus(status)
  }

  function renderDeptTree(depts: SysDept[], level = 0): FlatDeptItem[] {
    const result: FlatDeptItem[] = []
    for (const dept of depts) {
      result.push({ dept, level })
      if (dept.children) {
        result.push(...renderDeptTree(dept.children, level + 1))
      }
    }
    return result
  }

  function flatData(): FlatDeptItem[] {
    return renderDeptTree(treeData.value)
  }

  function closeModal() {
    modalVisible.value = false
  }

  onMounted(() => {
    fetchData()
    loadParentDeptOptions()
  })

  return {
    loading,
    treeData,
    modalVisible,
    modalLoading,
    isEdit,
    formData,
    parentDeptOptions,
    statusOptions,
    fetchData,
    loadParentDeptOptions,
    openAddModal,
    openEditModal,
    handleSubmit,
    handleDelete,
    formatStatus,
    renderDeptTree,
    flatData,
    closeModal,
  }
}
