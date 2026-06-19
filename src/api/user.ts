import request from '@/utils/request'
import type { ApiResponse, PageResult, SysUser, SysUserQuery, SysUserDTO, LoginUser, SysRole } from '@/types'

/**
 * 获取当前登录用户信息
 */
export function getLoginUser(username: string): Promise<ApiResponse<LoginUser>> {
  return request.get('/system/sysUser/getLoginUser', { params: { username } })
}

/**
 * 获取用户列表
 */
export function getUserList(params: SysUserQuery): Promise<ApiResponse<SysUser[]>> {
  return request.get('/system/sysUser/list', { params })
}

/**
 * 分页获取用户列表
 */
export function getUserPage(params: SysUserQuery): Promise<ApiResponse<PageResult<SysUser>>> {
  return request.get('/system/sysUser/page', { params })
}

/**
 * 获取用户详情
 */
export function getUser(userId: string | number): Promise<ApiResponse<SysUser>> {
  return request.get(`/system/sysUser/${userId}`)
}

/**
 * 新增用户
 */
export function addUser(data: SysUserDTO): Promise<ApiResponse<void>> {
  return request.post('/system/sysUser/add', data)
}

/**
 * 修改用户
 */
export function updateUser(data: SysUserDTO): Promise<ApiResponse<void>> {
  return request.post('/system/sysUser/update', data)
}

/**
 * 删除用户
 */
export function deleteUser(userId: string | number): Promise<ApiResponse<void>> {
  return request.delete(`/system/sysUser/${userId}`)
}

/**
 * 修改用户状态
 */
export function changeUserStatus(userId: string | number, status: string): Promise<ApiResponse<void>> {
  return request.put('/system/sysUser/changeStatus', null, { params: { userId, status } })
}

/**
 * 重置用户密码
 */
export function resetUserPwd(userId: string | number, password: string): Promise<ApiResponse<void>> {
  return request.put('/system/sysUser/resetPwd', null, { params: { userId, password } })
}

/**
 * 获取角色下拉列表（用于用户表单）
 */
export function getRoleOptions(): Promise<ApiResponse<SysRole[]>> {
  return request.get('/system/sysRole/list')
}
