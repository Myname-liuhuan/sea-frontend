import request from '@/utils/request'
import type { ApiResponse } from '@/types'
import type { ApplyRequest, ApplyResult } from '@/types/workflow'

/**
 * 发起重置密码申请。
 *
 * 携带 Idempotency-Key 头避免双提交（服务端 10 分钟 TTL 去重）。
 */
export function applyResetPassword(
  data: ApplyRequest,
  idempotencyKey?: string,
): Promise<ApiResponse<ApplyResult>> {
  const headers: Record<string, string> = {}
  if (idempotencyKey) headers['Idempotency-Key'] = idempotencyKey
  return request.post('/workflow/apply', data, { headers })
}
