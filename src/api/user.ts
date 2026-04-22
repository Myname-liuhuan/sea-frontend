import request from '@/utils/request'
import type { ApiResponse, PageResult, SysUser, SysUserQuery, SysUserDTO, LoginUser } from '@/types'

/**
 * 获取当前登录用户信息
 */
export function getLoginUser(username: string): Promise<ApiResponse<LoginUser>> {
  return request.get('/api/system/sysUser/getLoginUser', { params: { username } })
}

/**
 * 获取用户列表
 */
export function getUserList(params: SysUserQuery): Promise<ApiResponse<PageResult<SysUser>>> {
  return request.get('/api/system/sysUser/list', { params })
}

/**
 * 获取用户详情
 */
export function getUser(userId: number): Promise<ApiResponse<SysUser>> {
  return request.get(`/api/system/sysUser/${userId}`)
}

/**
 * 新增用户
 */
export function addUser(data: SysUserDTO): Promise<ApiResponse<void>> {
  return request.post('/api/system/sysUser', data)
}

/**
 * 修改用户
 */
export function updateUser(data: SysUserDTO): Promise<ApiResponse<void>> {
  return request.put('/api/system/sysUser', data)
}

/**
 * 删除用户
 */
export function deleteUser(userId: number): Promise<ApiResponse<void>> {
  return request.delete(`/api/system/sysUser/${userId}`)
}

/**
 * 修改用户状态
 */
export function changeUserStatus(userId: number, status: number): Promise<ApiResponse<void>> {
  return request.put('/api/system/sysUser/changeStatus', null, { params: { userId, status } })
}

/**
 * 重置用户密码
 */
export function resetUserPwd(userId: number, password: string): Promise<ApiResponse<void>> {
  return request.put('/api/system/sysUser/resetPwd', null, { params: { userId, password } })
}

/**
 * 获取角色下拉列表（用于用户表单）
 */
export function getRoleOptions(): Promise<ApiResponse<{ roleId: number; roleName: string }[]>> {
  return request.get('/api/system/role/options')
}
