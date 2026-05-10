// ========== API 响应 ==========

export const RESPONSE_CODE = {
  SUCCESS: 200,
} as const

// ========== HTTP 状态码 ==========

export const HTTP_STATUS = {
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_ERROR: 500,
} as const

// ========== 实体状态 ==========

export const ENTITY_STATUS = {
  ACTIVE: '1',
  DISABLED: '0',
} as const

// ========== 菜单类型 ==========

export const MENU_TYPE = {
  DIRECTORY: '1',
  MENU: '2',
  BUTTON: '3',
} as const

// ========== 菜单可见性 ==========

export const MENU_VISIBLE = {
  SHOW: '0',
  HIDE: '1',
} as const

// ========== 用户封禁状态 ==========

export const USER_BAN_STATUS = {
  NORMAL: '0',
  BANNED: '1',
} as const

// ========== 分页 ==========

export const PAGE_SIZE_OPTIONS = [10, 20, 50] as const // eslint-disable-line no-magic-numbers
export const DEFAULT_PAGE_SIZE = 10

// ========== 请求超时 ==========

export const REQUEST_TIMEOUT_MS = 15000

// ========== 显示文本映射 ==========

export const STATUS_LABELS: Record<string, string> = {
  [ENTITY_STATUS.ACTIVE]: '正常',
  [ENTITY_STATUS.DISABLED]: '停用',
}

export const MENU_TYPE_LABELS: Record<string, string> = {
  [MENU_TYPE.DIRECTORY]: '目录',
  [MENU_TYPE.MENU]: '菜单',
  [MENU_TYPE.BUTTON]: '按钮',
}

export const VISIBLE_LABELS: Record<string, string> = {
  [MENU_VISIBLE.SHOW]: '显示',
  [MENU_VISIBLE.HIDE]: '隐藏',
}
