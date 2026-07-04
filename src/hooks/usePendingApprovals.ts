import { reactive } from 'vue'
import { Message } from '@arco-design/web-vue'
import { useTable } from '@/hooks/useTable'
import { getPendingApprovals } from '@/api/workflow/list'
import { approveTask, reassignTask } from '@/api/workflow/approve'
import type { WorkflowTask, WorkflowTaskQuery, ApproveRequest, ReassignRequest } from '@/types/workflow'
import { RESPONSE_CODE } from '@/constants'
import { DEFAULT_LIST_PAGE_SIZE, DEFAULT_PAGE_NUM } from '@/constants/workflow'

/**
 * 待我审批列表 + 行内审批 / 转交操作。
 */
export function usePendingApprovals() {
  const searchForm = reactive<WorkflowTaskQuery>({
    urgency: undefined,
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
      getPendingApprovals(p).then((res) => {
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
    fetchData({ urgency: searchForm.urgency } as Partial<WorkflowTaskQuery>)
  }

  function handleReset() {
    searchForm.urgency = undefined
    handleSearch()
  }

  /**
   * 行内审批（通过 / 拒绝）。comment 可选填。
   */
  async function approve(row: WorkflowTask, approved: boolean, comment?: string): Promise<boolean> {
    const req: ApproveRequest = { taskNo: row.taskNo, approved, comment }
    const res = await approveTask(req)
    if (res.code !== RESPONSE_CODE.SUCCESS) return false
    Message.success(approved ? '已通过' : '已拒绝')
    await fetchData()
    return true
  }

  /**
   * 行内转交。
   */
  async function reassign(row: WorkflowTask, toUserId: number, comment?: string): Promise<boolean> {
    const req: ReassignRequest = { taskNo: row.taskNo, toUserId, comment }
    const res = await reassignTask(req)
    if (res.code !== RESPONSE_CODE.SUCCESS) return false
    Message.success('已转交')
    await fetchData()
    return true
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
    approve,
    reassign,
  }
}
