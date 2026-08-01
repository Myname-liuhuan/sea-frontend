// ========== 通用类型 ==========

/** 统一 API 响应格式 */
export interface ApiResponse<T = unknown> {
  code: number
  message: string
  data: T
}

/** 分页查询参数 */
export interface PageQuery {
  pageNum?: number
  pageSize?: number
  [key: string]: unknown
}

/** 分页结果 */
export interface PageResult<T> {
  rows: T[]
  total: number
  pageNum: number
  pageSize: number
}

// ========== 登录类型 ==========

/** 登录请求（后端只需要 username + password） */
export interface LoginDTO {
  username: string
  password: string
}

/** 登录结果 */
export interface LoginResult {
  accessToken: string
  refreshToken: string
  expiresIn: number
  /**
   * true 时用户当前密码是临时密码（重置密码工单后首登），前端路由 beforeEach 应强制跳
   * /change-password-first；改密完成后端置回 0，本字段会变 false。
   */
  mustChangePassword?: boolean
}

/** 登录用户信息 */
export interface LoginUser {
  id: string | number
  username: string
  password?: string
  version?: number
  roles: string[]
  perms: string[]
  /** 重置密码工单首次登录：服务端要求强制改密 */
  requirePasswordChange?: boolean
}

// ========== 下拉选项 ==========

/** 通用下拉选项 */
export interface Option {
  label: string
  value: number | string
}
