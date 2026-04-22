import { ref, reactive } from 'vue'
import type { PageQuery, PageResult } from '@/types'

interface UseTableOptions<T, P extends PageQuery> {
  api: (params: P) => Promise<PageResult<T>>
  defaultParams?: Partial<P>
}

export function useTable<T, P extends PageQuery = PageQuery>(
  options: UseTableOptions<T, P>
) {
  const { api, defaultParams = {} } = options

  const loading = ref(false)
  const dataSource = ref<T[]>([])
  const pagination = reactive({
    current: 1,
    pageSize: 10,
    total: 0,
    showTotal: true,
    showPageSize: true,
    showJumper: true,
  })

  async function fetchData(params?: Partial<P>) {
    loading.value = true
    try {
      const queryParams = {
        pageNum: pagination.current,
        pageSize: pagination.pageSize,
        ...defaultParams,
        ...params,
      } as P

      const res = await api(queryParams)
      dataSource.value = res.data.rows
      pagination.total = res.data.total
      pagination.current = res.data.pageNum
      pagination.pageSize = res.data.pageSize
    } finally {
      loading.value = false
    }
  }

  function onPageChange(page: number) {
    pagination.current = page
    fetchData()
  }

  function onPageSizeChange(pageSize: number) {
    pagination.pageSize = pageSize
    pagination.current = 1
    fetchData()
  }

  // 初始加载
  fetchData()

  return {
    loading,
    dataSource,
    pagination,
    fetchData,
    onPageChange,
    onPageSizeChange,
  }
}
