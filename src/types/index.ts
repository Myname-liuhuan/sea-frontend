// ========== 通用类型 ==========

/** 统一 API 响应格式 */
export interface ApiResponse<T = unknown> {
  code: number
  message: string
  data: T
}

/** 分页查询参数 */
export interface PageQuery {
  pageNum: number
  pageSize: number
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
}

/** 登录结果 */
export interface LoginResult {
  accessToken: string
  refreshToken: string
  expiresIn: number
}

/** 登录用户信息 */
export interface LoginUser {
  userId: number
  username: string
  nickname: string
  avatar?: string
  email?: string
  phone?: string
  roles: string[]
}

// ========== 用户类型 ==========

/** 用户实体 */
export interface SysUser {
  userId: number
  username: string
  nickname: string
  avatar?: string
  email?: string
  phone?: string
  sex?: number
  status?: number
  deptId?: number
  deptName?: string
  roleIds?: number[]
  roleNames?: string
  createTime?: string
  updateTime?: string
}

/** 用户查询参数 */
export interface SysUserQuery extends PageQuery {
  username?: string
  phone?: string
  status?: number
  deptId?: number
}

/** 用户表单数据 */
export interface SysUserDTO {
  userId?: number
  username: string
  nickname: string
  password?: string
  email?: string
  phone?: string
  sex?: number
  status?: number
  deptId?: number
  roleIds: number[]
}

// ========== 角色类型 ==========

/** 角色实体 */
export interface SysRole {
  roleId: number
  roleName: string
  roleKey: string
  roleSort: number
  dataScope?: string
  status: number
  createTime?: string
  updateTime?: string
}

/** 角色查询参数 */
export interface SysRoleQuery extends PageQuery {
  roleName?: string
  roleKey?: string
  status?: number
}

/** 角色表单数据 */
export interface SysRoleDTO {
  roleId?: number
  roleName: string
  roleKey: string
  roleSort: number
  status: number
  dataScope?: string
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

/** 菜单类型: 0=目录, 1=菜单, 2=按钮 */
export type MenuType = 0 | 1 | 2

/** 菜单实体 */
export interface SysMenu {
  menuId: number
  menuName: string
  parentId: number
  path: string
  component?: string
  menuType: MenuType
  visible: number
  status: number
  perms?: string
  icon?: string
  orderNum: number
  createTime?: string
  updateTime?: string
  children?: SysMenu[]
}

/** 菜单查询参数 */
export interface SysMenuQuery extends PageQuery {
  menuName?: string
  visible?: number
  status?: number
}

/** 菜单表单数据 */
export interface SysMenuDTO {
  menuId?: number
  menuName: string
  parentId: number
  path: string
  component?: string
  menuType: MenuType
  visible: number
  status: number
  perms?: string
  icon?: string
  orderNum: number
}

// ========== 下拉选项 ==========

/** 通用下拉选项 */
export interface Option {
  label: string
  value: number | string
}
