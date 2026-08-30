import { ref } from 'vue'
import { Message } from '@arco-design/web-vue'
import { getWorkflowDetail } from '@/api/workflow/list'
import type { WorkflowDetail } from '@/types/workflow'
import { RESPONSE_CODE } from '@/constants'

/**
 * 工单详情：单条拉取，无需分页。
 */
export function useWorkflowDetail() {
  const loading = ref(false)
  const detail = ref<WorkflowDetail | null>(null)

  async function fetchDetail(taskNo: string) {
    if (!taskNo) {
      detail.value = null
      return
    }
    loading.value = true
    try {
      const res = await getWorkflowDetail(taskNo)
      if (res.code !== RESPONSE_CODE.SUCCESS) {
        detail.value = null
        Message.error(res.message || '加载详情失败')
        return
      }
      detail.value = res.data
    } catch {
      // request.ts 已 Message.error；这里只需清掉 detail，避免空白页面残留旧数据
      detail.value = null
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    detail,
    fetchDetail,
  }
}
