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

/** 登录请求 */
export interface LoginDTO {
  username: string
  password: string
  refreshToken?: string
}

/** 登录结果 */
export interface LoginResult {
  accessToken: string
  refreshToken: string
  expiresIn: number
}

/** 登录用户信息 */
export interface LoginUser {
  id: number
  username: string
  password?: string
  version?: number
  roles: string[]
  perms: string[]
}

// ========== 用户类型 ==========

/** 用户视图对象 (对应后端 SysUserVO) */
export interface SysUser {
  id: number
  username: string
  email?: string
  mobile?: string
  avatarUrl?: string
  profile?: string
  isBanned?: string
  bannedUntil?: string
  createTime?: string
  updateTime?: string
  createBy?: number
  updateBy?: number
  delFlag?: number
}

/** 用户查询参数 (对应后端 SysUserQueryParam) */
export interface SysUserQuery extends PageQuery {
  username?: string
  email?: string
  mobile?: string
  avatarUrl?: string
  profile?: string
  createTimeStart?: string
  createTimeEnd?: string
}

/** 用户表单数据 (对应后端 SysUserDTO) */
export interface SysUserDTO {
  id?: number
  username: string
  email: string
  mobile?: string
  password?: string
  avatarUrl?: string
  profile?: string
}

// ========== 角色类型 ==========

/** 角色实体 */
export interface SysRole {
  id: number
  roleName: string
  roleCode: string
  roleDesc?: string
  dataScope?: string
  status: string
  createTime?: string
  updateTime?: string
  createBy?: number
  updateBy?: number
  delFlag?: number
}

/** 角色查询参数 */
export interface SysRoleQuery extends PageQuery {
  roleName?: string
  roleCode?: string
  status?: string
  createTimeStart?: string
  createTimeEnd?: string
}

/** 角色表单数据 */
export interface SysRoleDTO {
  id?: number
  roleName: string
  roleCode: string
  roleDesc?: string
  dataScope?: string
  status?: string
}

/** 分配用户请求 */
export interface AssignUsersDTO {
  roleId: number
  userIds: number[]
}

/** 分配菜单请求 */
export interface AssignMenusDTO {
  roleId: number
  menuIds: number[]
}

// ========== 菜单类型 ==========

/** 菜单类型: 1=目录, 2=菜单, 3=按钮 */
export type MenuType = string

/** Tree node display format for Arco Tree component */
export interface TreeNodeDisplay {
  id: string
  [key: string]: unknown
  children?: TreeNodeDisplay[]
}

/** 菜单实体 */
export interface SysMenu {
  id: number
  menuId: number
  parentId: number
  menuName: string
  menuType: string
  path: string
  component?: string
  perms?: string
  icon?: string
  visible: string
  orderNum: number
  createTime?: string
  updateTime?: string
  createBy?: number
  updateBy?: number
  delFlag?: number
  children?: SysMenu[]
}

/** 菜单查询参数 */
export interface SysMenuQuery extends PageQuery {
  menuName?: string
  visible?: string
  status?: string
}

/** 菜单表单数据 */
export interface SysMenuDTO {
  id?: number
  parentId: number
  menuName: string
  menuType: string
  path: string
  component?: string
  perms?: string
  icon?: string
  visible?: string
  orderNum: number
}

// ========== 下拉选项 ==========

/** 通用下拉选项 */
export interface Option {
  label: string
  value: number | string
}
