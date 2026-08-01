import { ref, reactive, onMounted } from 'vue'
import { getAllMenuTree, getMenuOptions, addMenu, updateMenu, deleteMenu } from '@/api/system/menu'
import type { SysMenu, SysMenuDTO, TreeNodeDisplay } from '@/types/system'
import type { Option } from '@/types'
import { RESPONSE_CODE, MENU_TYPE, MENU_VISIBLE } from '@/constants'
import { MENU_TYPE_LABELS } from '@/constants'
import { toTreeNodeDisplay } from '@/utils/tree'
import { formatMenuType, formatVisible } from '@/utils/format'
import { Message, Modal } from '@arco-design/web-vue'

const DEFAULT_FORM_DATA: SysMenuDTO = {
  menuName: '',
  parentId: 0,
  path: '',
  component: '',
  menuType: MENU_TYPE.MENU,
  visible: MENU_VISIBLE.SHOW,
  perms: '',
  icon: '',
  orderNum: 0,
}

const TOP_LEVEL_MENU: SysMenu = {
  id: 0,
  menuId: 0,
  parentId: 0,
  menuName: '顶级菜单',
  path: '',
  menuType: MENU_TYPE.DIRECTORY,
  visible: MENU_VISIBLE.SHOW,
  orderNum: 0,
}

export function useMenuPage() {
  const loading = ref(false)
  const menuTree = ref<TreeNodeDisplay[]>([])
  const expandedKeys = ref<string[]>([])

  const modalVisible = ref(false)
  const modalLoading = ref(false)
  const isEdit = ref(false)
  const formData = reactive<SysMenuDTO>({ ...DEFAULT_FORM_DATA })

  const menuOptions = ref<SysMenu[]>([])

  const menuTypeOptions: Option[] = [
    { label: MENU_TYPE_LABELS[MENU_TYPE.DIRECTORY], value: MENU_TYPE.DIRECTORY },
    { label: MENU_TYPE_LABELS[MENU_TYPE.MENU], value: MENU_TYPE.MENU },
    { label: MENU_TYPE_LABELS[MENU_TYPE.BUTTON], value: MENU_TYPE.BUTTON },
  ]

  const statusOptions: Option[] = [
    { label: '显示', value: MENU_VISIBLE.SHOW },
    { label: '隐藏', value: MENU_VISIBLE.HIDE },
  ]

  async function fetchMenuTree() {
    loading.value = true
    try {
      const res = await getAllMenuTree()
      if (res.code === RESPONSE_CODE.SUCCESS) {
        menuTree.value = res.data.map(toTreeNodeDisplay)
        expandedKeys.value = res.data.map((m: SysMenu) => String(m.id))
      }
    } finally {
      loading.value = false
    }
  }

  async function loadMenuOptions() {
    const res = await getMenuOptions()
    if (res.code === RESPONSE_CODE.SUCCESS) {
      menuOptions.value = [TOP_LEVEL_MENU, ...res.data]
    }
  }

  function resetFormData() {
    Object.assign(formData, { ...DEFAULT_FORM_DATA, id: undefined })
  }

  function openAddModal(parentId = 0) {
    isEdit.value = false
    resetFormData()
    formData.parentId = parentId
    loadMenuOptions()
    modalVisible.value = true
  }

  function openEditModal(row: SysMenu) {
    isEdit.value = true
    Object.assign(formData, {
      id: row.id,
      menuName: row.menuName,
      parentId: row.parentId,
      path: row.path,
      component: row.component ?? '',
      menuType: row.menuType,
      visible: row.visible,
      perms: row.perms ?? '',
      icon: row.icon ?? '',
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
      if (res.code === RESPONSE_CODE.SUCCESS) {
        Message.success(isEdit.value ? '修改成功' : '新增成功')
        modalVisible.value = false
        fetchMenuTree()
      }
    } finally {
      modalLoading.value = false
    }
  }

  function confirmDelete(menuId: string | number, menuName: string) {
    Modal.warning({
      title: '确认删除',
      content: `确定要删除菜单 "${menuName}" 吗？`,
      okText: '确定',
      cancelText: '取消',
      async onOk() {
        const res = await deleteMenu(menuId)
        if (res.code === RESPONSE_CODE.SUCCESS) {
          Message.success('删除成功')
          fetchMenuTree()
        }
      },
    })
  }

  function handleDelete(row: SysMenu) {
    const hasChildren = row.children && row.children.length > 0
    if (hasChildren) {
      Message.warning('该菜单下存在子菜单，请先删除子菜单')
      return
    }
    confirmDelete(row.id, row.menuName)
  }

  onMounted(() => {
    fetchMenuTree()
  })

  return {
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
    fetchMenuTree,
    loadMenuOptions,
    openAddModal,
    openEditModal,
    handleSubmit,
    handleDelete,
    formatMenuType,
    formatVisible,
  }
}
