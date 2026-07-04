import request from '@/utils/request'
import type { ApiResponse, PageResult } from '@/types'
import type { InAppMessage } from '@/types/workflow'

/** 站内信未读数 */
export function getUnreadCount(): Promise<ApiResponse<number>> {
  return request.post('/notification/unread-count')
}

/** 站内信列表 */
export function getInAppMessages(
  pageNum: number,
  pageSize: number,
): Promise<ApiResponse<PageResult<InAppMessage>>> {
  return request.get('/notification/messages', { params: { pageNum, pageSize } })
}

/** 标记一条已读 */
export function markMessageRead(id: number): Promise<ApiResponse<void>> {
  return request.post(`/notification/messages/${id}/read`)
}

/** 标记全部已读 */
export function markAllRead(): Promise<ApiResponse<void>> {
  return request.post('/notification/messages/read-all')
}
