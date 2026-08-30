import { reactive } from 'vue'
import { Message, Modal } from '@arco-design/web-vue'
import { useRouter } from 'vue-router'
import { useTable } from '@/hooks/useTable'
import {
  cloneModel,
  deleteModel,
  deployModel,
  listModels,
} from '@/api/workflow/model'
import { RESPONSE_CODE } from '@/constants'
import { DEFAULT_LIST_PAGE_SIZE, DEFAULT_PAGE_NUM } from '@/constants/workflow'
import type { PageResult } from '@/types'
import type {
  WorkflowModelListItem,
  WorkflowModelQuery,
} from '@/types/workflow'

/**
 * 流程模型列表页状态：搜索 / 分页 / CRUD。
 *
 * 与 useAllTasks / useMyApplications 同款骨架：
 * searchForm + useTable 包装 axios + Modal.warning 确认 + Message 反馈。
 */
export function useModelList() {
  const searchForm = reactive<WorkflowModelQuery>({
    name: undefined,
    key: undefined,
    businessType: undefined,
  })

  const {
    loading,
    dataSource,
    pagination,
    fetchData,
    onPageChange,
    onPageSizeChange,
  } = useTable<WorkflowModelListItem, WorkflowModelQuery>({
    api: async (p) => {
      const res = await listModels(p)
      if (res.code !== RESPONSE_CODE.SUCCESS || res.data == null) {
        return {
          rows: [],
          total: 0,
          pageNum: p.pageNum ?? DEFAULT_PAGE_NUM,
          pageSize: p.pageSize ?? DEFAULT_LIST_PAGE_SIZE,
        } satisfies PageResult<WorkflowModelListItem>
      }
      return res.data
    },
  })

  function handleSearch() {
    pagination.current = 1
    fetchData({
      name: searchForm.name || undefined,
      key: searchForm.key || undefined,
      businessType: searchForm.businessType || undefined,
    })
  }

  function handleReset() {
    searchForm.name = undefined
    searchForm.key = undefined
    searchForm.businessType = undefined
    handleSearch()
  }

  const router = useRouter()
  function handleCreate() {
    void router.push({ path: '/workflow/designer', query: { mode: 'new' } })
  }

  function handleEdit(row: WorkflowModelListItem) {
    void router.push({
      path: '/workflow/designer',
      query: { id: row.id, mode: 'edit' },
    })
  }

  function handleDelete(row: WorkflowModelListItem) {
    Modal.warning({
      title: '确认删除',
      content: `删除模型 "${row.name}"？已部署的流程定义不会被级联删除。`,
      okText: '确定',
      cancelText: '取消',
      async onOk() {
        try {
          const res = await deleteModel(row.id)
          if (res.code === RESPONSE_CODE.SUCCESS) {
            Message.success('已删除')
            fetchData()
          } else {
            Message.error(res.message || '删除失败')
          }
        } catch {
          // request.ts 已 Message.error；吞掉异常避免 unhandled rejection
        }
      },
    })
  }

  function handleDeploy(row: WorkflowModelListItem) {
    Modal.warning({
      title: '部署流程',
      content: `将部署模型 "${row.name}"，部署后将立即可用于启动流程实例。`,
      okText: '部署',
      cancelText: '取消',
      async onOk() {
        try {
          const res = await deployModel(row.id)
          if (res.code === RESPONSE_CODE.SUCCESS && res.data) {
            Message.success(`部署成功 (v${res.data.version})`)
            fetchData()
          } else {
            Message.error(res.message || '部署失败')
          }
        } catch {
          // request.ts 已 Message.error；吞掉异常避免 unhandled rejection
        }
      },
    })
  }

  function handleClone(row: WorkflowModelListItem) {
    const newName = `${row.name}_副本`
    Modal.warning({
      title: '克隆模型',
      content: `将基于 "${row.name}" 创建新副本 "${newName}"。`,
      okText: '克隆',
      cancelText: '取消',
      async onOk() {
        try {
          const res = await cloneModel(row.id, newName)
          if (res.code === RESPONSE_CODE.SUCCESS) {
            Message.success('已克隆')
            fetchData()
          } else {
            Message.error(res.message || '克隆失败')
          }
        } catch {
          // request.ts 已 Message.error；吞掉异常避免 unhandled rejection
        }
      },
    })
  }

  return {
    searchForm,
    loading,
    dataSource,
    pagination,
    handleSearch,
    handleReset,
    handleCreate,
    handleEdit,
    handleDelete,
    handleDeploy,
    handleClone,
    onPageChange,
    onPageSizeChange,
  }
}