import request from '@/utils/request'
import type { ApiResponse, PageResult } from '@/types'
import type {
  CreateModelRequest,
  DeployModelResult,
  SaveBpmnRequest,
  UpdateModelRequest,
  WorkflowModel,
  WorkflowModelListItem,
  WorkflowModelQuery,
} from '@/types/workflow'

/** 流程模型列表（分页） */
export function listModels(
  params: WorkflowModelQuery,
): Promise<ApiResponse<PageResult<WorkflowModelListItem>>> {
  return request.get('/workflow/model/list', { params })
}

/** 流程模型详情 */
export function getModel(id: string): Promise<ApiResponse<WorkflowModel>> {
  return request.get(`/workflow/model/${id}`)
}

/** 新建流程模型 */
export function createModel(
  data: CreateModelRequest,
): Promise<ApiResponse<WorkflowModel>> {
  return request.post('/workflow/model', data)
}

/** 更新流程模型元数据 */
export function updateModel(
  id: string,
  data: UpdateModelRequest,
): Promise<ApiResponse<WorkflowModel>> {
  return request.put(`/workflow/model/${id}`, data)
}

/** 删除流程模型 */
export function deleteModel(id: string): Promise<ApiResponse<void>> {
  return request.delete(`/workflow/model/${id}`)
}

/** 取模型的 BPMN XML */
export function getModelBpmn(id: string): Promise<ApiResponse<string>> {
  return request.get(`/workflow/model/${id}/bpmn`)
}

/** 保存 BPMN XML */
export function saveModelBpmn(
  id: string,
  data: SaveBpmnRequest,
): Promise<ApiResponse<void>> {
  return request.put(`/workflow/model/${id}/bpmn`, data)
}

/** 部署流程模型 */
export function deployModel(id: string): Promise<ApiResponse<DeployModelResult>> {
  return request.post(`/workflow/model/${id}/deploy`)
}

/** 克隆流程模型 */
export function cloneModel(
  id: string,
  newName: string,
): Promise<ApiResponse<WorkflowModel>> {
  return request.post(`/workflow/model/${id}/clone`, null, {
    params: { newName },
  })
}