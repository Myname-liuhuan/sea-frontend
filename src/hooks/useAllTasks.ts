import { reactive } from 'vue'
import { useTable } from '@/hooks/useTable'
import { getAllTasks } from '@/api/workflow/list'
import type { WorkflowTask, WorkflowTaskQuery } from '@/types/workflow'
import { DEFAULT_LIST_PAGE_SIZE, DEFAULT_PAGE_NUM } from '@/constants/workflow'

/**
 * 工单监控（全量）—— 仅 admin 可见。
 *
 * 列表项不带"通过/拒绝"按钮（admin 在监控页只看，不直接审批）；
 * 如需代审，进详情页或跳"待我审批"。
 */
export function useAllTasks() {
  const searchForm = reactive<WorkflowTaskQuery>({
    status: undefined,
    urgency: undefined,
    applicantId: undefined,
    targetUserId: undefined,
  })

  const {
    loading,
    dataSource,
    pagination,
    fetchData,
    onPageChange,
    onPageSizeChange,
  } = useTable<WorkflowTask, WorkflowTaskQuery>({
    api: (p) =>
      getAllTasks(p).then((res) => {
        if (res.data == null) {
          return {
            rows: [],
            total: 0,
            pageNum: p.pageNum ?? DEFAULT_PAGE_NUM,
            pageSize: p.pageSize ?? DEFAULT_LIST_PAGE_SIZE,
          }
        }
        return res.data
      }),
  })

  function handleSearch() {
    pagination.current = 1
    fetchData({
      status: searchForm.status,
      urgency: searchForm.urgency,
      applicantId: searchForm.applicantId,
      targetUserId: searchForm.targetUserId,
    } as Partial<WorkflowTaskQuery>)
  }

  function handleReset() {
    searchForm.status = undefined
    searchForm.urgency = undefined
    searchForm.applicantId = undefined
    searchForm.targetUserId = undefined
    handleSearch()
  }

  return {
    searchForm,
    loading,
    dataSource,
    pagination,
    fetchData,
    onPageChange,
    onPageSizeChange,
    handleSearch,
    handleReset,
  }
}
