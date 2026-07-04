import request from '@/utils/request'
import type { ApiResponse, PageResult } from '@/types'
import type {
  WorkflowDetail,
  WorkflowTask,
  WorkflowTaskQuery,
  WorkflowDefinition,
} from '@/types/workflow'

/** 我的申请 */
export function getMyApplications(
  params: WorkflowTaskQuery,
): Promise<ApiResponse<PageResult<WorkflowTask>>> {
  return request.get('/workflow/my-applications', { params })
}

/** 待我审批 */
export function getPendingApprovals(
  params: WorkflowTaskQuery,
): Promise<ApiResponse<PageResult<WorkflowTask>>> {
  return request.get('/workflow/pending-approvals', { params })
}

/** 工单监控（全量，admin） */
export function getAllTasks(
  params: WorkflowTaskQuery,
): Promise<ApiResponse<PageResult<WorkflowTask>>> {
  return request.get('/workflow/all-tasks', { params })
}

/** 工单详情 */
export function getWorkflowDetail(taskNo: string): Promise<ApiResponse<WorkflowDetail>> {
  return request.get(`/workflow/detail/${taskNo}`)
}

/** 流程定义查询（admin） */
export function listDefinitions(
  businessType: string,
): Promise<ApiResponse<WorkflowDefinition[]>> {
  return request.post('/workflow/definition/list', businessType, {
    headers: { 'Content-Type': 'text/plain' },
  })
}
