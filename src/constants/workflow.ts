/**
 * 工作流域常量（避免 hook / view 出现魔法数字）。
 */

/** 申请原因最长字符数 */
export const APPLY_REASON_MAX_LENGTH = 500

/** 默认铃铛未读上限显示文字 */
export const INBOX_BADGE_MAX = 99

/** 收件箱每页条数 */
export const INBOX_PAGE_SIZE = 10

/** 铃铛未读数轮询周期（60s） */
export const INBOX_POLL_INTERVAL_MS = 60_000

/** 申请幂等键：apply-{userId}-{ts} 命名空间 */
export const APPLY_IDEMPOTENCY_PREFIX = 'apply'

/** 默认页码 */
export const DEFAULT_PAGE_NUM = 1

/** 默认每页条数（列表兜底） */
export const DEFAULT_LIST_PAGE_SIZE = 10

/** 强制改密页：密码最短长度 */
export const MIN_PASSWORD_LENGTH = 8

// ============ 流程模型设计器 ============

/** 流程模型权限点（与后端 WorkflowPermissionConstants 对应） */
export const WORKFLOW_MODEL_PERMS = {
  READ: 'workflow:model:read',
  WRITE: 'workflow:model:write',
  DEPLOY: 'workflow:model:deploy',
  DELETE: 'workflow:model:delete',
} as const

/**
 * 设计器右侧属性面板宽度（px）。
 *
 * 之前是 320px，但实测在大屏上占 ~28% 显得过宽；调到 288 既能容下 bpmn-js-properties-panel
 * 的常用 entry（assignee / formKey / 监听器 列表），又把更多横向空间让给画布。
 * 仍嫌宽可一键折叠成 36px 窄边（见 designer/index.vue 的 propertiesCollapsed）。
 */
export const BPMN_PROPERTIES_PANEL_WIDTH = 288

/** 设计器画布最小高度（px） */
export const BPMN_CANVAS_MIN_HEIGHT = 600

/** 模型 key 命名最大长度 */
export const MODEL_KEY_MAX_LENGTH = 64

/** 模型名称最大长度 */
export const MODEL_NAME_MAX_LENGTH = 100

/** 业务描述最大长度 */
export const MODEL_DESC_MAX_LENGTH = 500

// ============ 设计器布局常量 ============

/** Palette 宽度（px）—— bpmn-js palette 默认 50 只能放图标；我们加了中文短标签，需要 88px */
export const BPMN_PALETTE_WIDTH = 88

/** Minimap 尺寸（px） */
export const BPMN_MINIMAP_WIDTH = 200
export const BPMN_MINIMAP_HEIGHT = 140

/** Linter 面板最大高度（px） */
export const BPMN_LINTER_MAX_HEIGHT = 240
