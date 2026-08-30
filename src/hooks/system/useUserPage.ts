import { reactive, ref } from 'vue'
import { Message, Modal } from '@arco-design/web-vue'
import { useTable } from '@/hooks/useTable'
import { getUserPage, addUser, updateUser, deleteUser } from '@/api/system/user'
import type { SysUser, SysUserQuery, SysUserDTO } from '@/types/system'
import { RESPONSE_CODE } from '@/constants'
import isEmail from 'validator/lib/isEmail'
import isMobilePhone from 'validator/lib/isMobilePhone'

export function useUserPage() {
  const searchForm = reactive({
    username: '',
    mobile: '',
  })

  const { loading, dataSource, pagination, fetchData, onPageChange, onPageSizeChange } = useTable<
    SysUser,
    SysUserQuery
  >({
    api: (params) => getUserPage(params).then((res) => res.data),
  })

  const modalVisible = ref(false)
  const modalLoading = ref(false)
  const isEdit = ref(false)

  const formData = reactive<SysUserDTO>({
    id: undefined,
    username: '',
    password: '',
    email: '',
    mobile: '',
  })

  function handleSearch() {
    pagination.current = 1
    fetchData({
      username: searchForm.username || undefined,
      mobile: searchForm.mobile || undefined,
    } as Partial<SysUserQuery>)
  }

  function handleReset() {
    searchForm.username = ''
    searchForm.mobile = ''
    handleSearch()
  }

  function openAddModal() {
    isEdit.value = false
    Object.assign(formData, {
      id: undefined,
      username: '',
      password: '',
      email: '',
      mobile: '',
    })
    modalVisible.value = true
  }

  function openEditModal(row: SysUser) {
    isEdit.value = true
    Object.assign(formData, {
      id: row.id,
      username: row.username,
      password: '',
      email: row.email || '',
      mobile: row.mobile || '',
    })
    modalVisible.value = true
  }

  function validateFormData(): boolean {
    if (!formData.username.trim()) {
      Message.warning('请输入用户名')
      return false
    }
    if (!isEdit.value && !formData.password?.trim()) {
      Message.warning('请输入密码')
      return false
    }
    if (formData.email && !isEmail(formData.email)) {
      Message.warning('邮箱格式不正确')
      return false
    }
    if (formData.mobile && !isMobilePhone(formData.mobile, 'zh-CN')) {
      Message.warning('手机号格式不正确')
      return false
    }
    return true
  }

  async function handleSubmit() {
    if (!validateFormData()) return

    modalLoading.value = true
    try {
      const api = isEdit.value ? updateUser : addUser
      const res = await api(formData)
      if (res.code === RESPONSE_CODE.SUCCESS) {
        Message.success(isEdit.value ? '修改成功' : '新增成功')
        closeModal()
        fetchData()
      }
    } catch {
      // request.ts 已 Message.error；吞掉异常避免 unhandled rejection
    } finally {
      modalLoading.value = false
    }
  }

  function handleDelete(row: SysUser) {
    Modal.warning({
      title: '确认删除',
      content: `确定要删除用户 "${row.username}" 吗？`,
      okText: '确定',
      cancelText: '取消',
      async onOk() {
        try {
          const res = await deleteUser(row.id)
          if (res.code === RESPONSE_CODE.SUCCESS) {
            Message.success('删除成功')
            fetchData()
          }
        } catch {
          // request.ts 已 Message.error；吞掉异常避免 unhandled rejection
        }
      },
    })
  }

  function closeModal() {
    modalVisible.value = false
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
    handleSearch,
    handleReset,
    openAddModal,
    openEditModal,
    handleSubmit,
    handleDelete,
    onPageChange,
    onPageSizeChange,
    closeModal,
  }
}
