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
  approverId: number
  approverName?: string
  approved: number
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
