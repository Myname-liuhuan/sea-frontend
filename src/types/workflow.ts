// ========== 工作流（重置密码工单）类型 ==========

/** 发起重置密码申请请求 */
export interface ApplyRequest {
  targetUserId: number
  reason: string
  urgency: typeof URGENCY.NORMAL | typeof URGENCY.URGENT
}

/** 发起申请返回 */
export interface ApplyResult {
  taskNo: string
  taskId: number
}

/** 审批通过/拒绝请求 */
export interface ApproveRequest {
  taskNo: string
  approved: boolean
  comment?: string
}

/** 转交请求 */
export interface ReassignRequest {
  taskNo: string
  toUserId: number
  comment?: string
}

/** 工单视图（列表项） */
export interface WorkflowTask {
  id: number
  taskNo: string
  businessType: string
  applicantId: number
  applicantName?: string
  targetUserId: number
  targetUserName?: string
  reason: string
  urgency: number
  status: number
  statusLabel?: string
  currentNode?: string
  createTime: string
}

/** 审批记录视图 */
export interface WorkflowApproval {
  id: number
  taskId: number
  nodeKey: string
  nodeOrder: number
  approverId: number | null
  approverName?: string
  approved: number | null
  comment?: string
  delegatedFrom?: number
  createTime: string
}

/** 工单详情 */
export interface WorkflowDetail {
  task: WorkflowTask
  approvals: WorkflowApproval[]
}

/** 工单列表查询参数 */
export interface WorkflowTaskQuery {
  pageNum?: number
  pageSize?: number
  status?: number
  urgency?: number
  applicantId?: number
  targetUserId?: number
  [key: string]: unknown
}

/** 流程定义视图 */
export interface WorkflowDefinition {
  id: number
  businessType: string
  version: number
  definitionJson: string
  enabled: number
  isCurrent: number
}

/** 管理员紧急重置请求 */
export interface AdminEmergencyRequest {
  targetUserId: number
  reason: string
}

/** 通知请求（M4 内部用；M3 的 sea-notification 控制器对应） */
export interface NotifyRequest {
  primaryChannel: 'IN_APP' | 'EMAIL' | 'SMS'
  fallbackChannels?: Array<'IN_APP' | 'EMAIL' | 'SMS'>
  receiverUserId: number
  templateCode: string
  params: Record<string, string>
  bizKey?: string
  appName?: string
  email?: string
  mobile?: string
}

/** 站内信视图 */
export interface InAppMessage {
  id: number
  userId: number
  title: string
  content: string
  link?: string
  readFlag: 0 | 1
  createdAt: string
}

/** 工单状态枚举 */
export const WORKFLOW_STATUS = {
  PENDING: 0,
  IN_PROGRESS: 1,
  APPROVED: 2,
  REJECTED: 3,
  WITHDRAWN: 4,
  COMPLETED: 5,
} as const
export type WorkflowStatus = (typeof WORKFLOW_STATUS)[keyof typeof WORKFLOW_STATUS]

/** 紧急程度枚举 */
export const URGENCY = {
  NORMAL: 1,
  URGENT: 2,
} as const

/** 状态映射 label */
export const WORKFLOW_STATUS_LABEL: Record<number, string> = {
  0: '待审批',
  1: '审批中',
  2: '已通过',
  3: '已拒绝',
  4: '已撤回',
  5: '已完成',
}

/**
 * 审批节点状态枚举。
 *
 * <p>apply 时后端按 BPMN 链路预生成占位行，此时 approved 留空 → 前端用 PENDING(null) 标识"等待中"。
 * 数值约定与后端 WorkflowApprovalPO.approved 一致。
 */
export const APPROVAL_STATUS = {
  /** 等待中（apply 时预生成占位） */
  PENDING: null,
  /** 通过 */
  APPROVED: 1,
  /** 拒绝 */
  REJECTED: 0,
  /** 已转交（reassign 单独插入的事件行） */
  DELEGATED: -1,
} as const

/** 审批节点状态文案；PENDING(null) 走 getApprovalStatusLabel 专门分支 */
export const APPROVAL_STATUS_LABEL: Record<number, string> = {
  [APPROVAL_STATUS.APPROVED]: '通过',
  [APPROVAL_STATUS.REJECTED]: '拒绝',
  [APPROVAL_STATUS.DELEGATED]: '已转交',
}

/** approved 可能为 null（等待中占位）或后端未来新增的状态码，统一收口处理 */
export function getApprovalStatusLabel(approved: number | null | undefined): string {
  if (approved == null) return '等待中'
  return APPROVAL_STATUS_LABEL[approved] ?? '未知'
}

// ============ 流程模型（设计器） ============

/** 模型列表项 */
export interface WorkflowModelListItem {
  id: string
  name: string
  key: string
  category?: string
  version: number
  deploymentId?: string
  businessType?: string
  description?: string
  creatorName?: string
  createTime: string
  lastUpdateTime?: string
}

/** 模型详情（含 META_INFO_ 解析字段） */
export interface WorkflowModel {
  id: string
  name: string
  key: string
  category?: string
  version: number
  metaInfo?: string
  deploymentId?: string
  tenantId?: string
  businessType?: string
  description?: string
  creatorId?: number
  creatorName?: string
  metaVersion?: number
  createTime: string
  lastUpdateTime?: string
}

/** 模型查询参数 */
export interface WorkflowModelQuery {
  pageNum?: number
  pageSize?: number
  name?: string
  key?: string
  category?: string
  businessType?: string
  [key: string]: unknown
}

/** 新建模型请求 */
export interface CreateModelRequest {
  name: string
  key: string
  category?: string
  businessType: string
  description?: string
}

/** 更新模型请求 */
export interface UpdateModelRequest {
  name?: string
  category?: string
  businessType?: string
  description?: string
}

/** 保存 BPMN 请求 */
export interface SaveBpmnRequest {
  xml: string
  svg?: string
}

/** 部署结果 */
export interface DeployModelResult {
  deploymentId: string
  deployedProcessDefinitionIds: string[]
  version: number
}

/** 流程模型历史版本（不含 bpmn_xml 全文） */
export interface WorkflowModelVersion {
  id: number
  modelId: string
  version: number
  changeComment?: string
  creatorId?: number
  creatorName?: string
  createTime: string
  latest: boolean
}
