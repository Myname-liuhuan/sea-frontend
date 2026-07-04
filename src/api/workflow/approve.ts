import request from '@/utils/request'
import type { ApiResponse, ApproveRequest, ReassignRequest } from '@/types/workflow'

/** 审批通过 / 拒绝 */
export function approveTask(data: ApproveRequest): Promise<ApiResponse<void>> {
  return request.post('/workflow/approve', data)
}

/** 审批人转交 / 委派 */
export function reassignTask(data: ReassignRequest): Promise<ApiResponse<void>> {
  return request.post('/workflow/reassign', data)
}
