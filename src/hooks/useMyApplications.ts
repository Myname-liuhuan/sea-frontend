import { reactive } from 'vue'
import { useTable } from '@/hooks/useTable'
import { getMyApplications } from '@/api/workflow/list'
import type { WorkflowTask, WorkflowTaskQuery } from '@/types/workflow'

/**
 * 我的申请列表。
 */
export function useMyApplications() {
  const searchForm = reactive<WorkflowTaskQuery>({
    status: undefined,
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
      getMyApplications(p).then((res) => {
        if (res.data == null) {
          return { rows: [], total: 0, pageNum: p.pageNum ?? 1, pageSize: p.pageSize ?? 10 }
        }
        return res.data
      }),
  })

  function handleSearch() {
    pagination.current = 1
    fetchData({
      status: searchForm.status,
      urgency: searchForm.urgency,
    } as Partial<WorkflowTaskQuery>)
  }

  function handleReset() {
    searchForm.status = undefined
    searchForm.urgency = undefined
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
