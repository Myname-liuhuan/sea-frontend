import request from '@/utils/request'
import type { ApiResponse, PageResult, SysRole, SysRoleQuery, SysRoleDTO, Option } from '@/types'

/**
 * 获取角色列表
 */
export function getRoleList(params: SysRoleQuery): Promise<ApiResponse<PageResult<SysRole>>> {
  return request.get('/system/role', { params })
}

/**
 * 获取角色详情
 */
export function getRole(roleId: number): Promise<ApiResponse<SysRole>> {
  return request.get(`/system/role/${roleId}`)
}

/**
 * 新增角色
 */
export function addRole(data: SysRoleDTO): Promise<ApiResponse<void>> {
  return request.post('/system/role', data)
}

/**
 * 修改角色
 */
export function updateRole(data: SysRoleDTO): Promise<ApiResponse<void>> {
  return request.put('/system/role', data)
}

/**
 * 删除角色
 */
export function deleteRole(roleId: number): Promise<ApiResponse<void>> {
  return request.delete(`/system/role/${roleId}`)
}

/**
 * 分配用户给角色
 */
export function assignUsers(data: { roleId: number; userIds: number[] }): Promise<ApiResponse<void>> {
  return request.put('/system/role/assignUsers', data)
}

/**
 * 获取角色已分配的用户ID列表
 */
export function getRoleUsers(roleId: number): Promise<ApiResponse<number[]>> {
  return request.get(`/system/role/${roleId}/users`)
}

/**
 * 分配菜单权限给角色
 */
export function assignMenus(data: { roleId: number; menuIds: number[] }): Promise<ApiResponse<void>> {
  return request.put('/system/role/assignMenus', data)
}

/**
 * 获取角色已分配的菜单ID列表
 */
export function getRoleMenus(roleId: number): Promise<ApiResponse<number[]>> {
  return request.get(`/system/role/${roleId}/menus`)
}

/**
 * 获取所有角色选项（用于用户分配）
 */
export function getAllRoleOptions(): Promise<ApiResponse<Option[]>> {
  return request.get('/system/role/options')
}
