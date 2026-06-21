import request from '@/utils/request'
import type { ApiResponse, PageResult, SysRole, SysRoleQuery, SysRoleDTO } from '@/types'

/**
 * 获取角色分页列表
 */
export function getRoleList(params: SysRoleQuery): Promise<ApiResponse<PageResult<SysRole>>> {
  return request.get('/system/sysRole/page', { params })
}

/**
 * 获取角色列表（不分页）
 */
export function getAllRoleList(params?: SysRoleQuery): Promise<ApiResponse<SysRole[]>> {
  return request.get('/system/sysRole/list', { params })
}

/**
 * 新增角色
 */
export function addRole(data: SysRoleDTO): Promise<ApiResponse<void>> {
  return request.post('/system/sysRole/add', data)
}

/**
 * 修改角色
 */
export function updateRole(data: SysRoleDTO): Promise<ApiResponse<void>> {
  return request.post('/system/sysRole/edit', data)
}

/**
 * 删除角色（硬删，会级联清理角色-用户、角色-菜单关联）
 * 后端对应 DELETE /system/sysRole/{id}（sys:role:delete 权限）
 */
export function deleteRole(roleId: string | number): Promise<ApiResponse<void>> {
  return request.delete(`/system/sysRole/${roleId}`)
}

/**
 * 分配用户给角色
 */
export function assignUsers(data: { roleId: string | number; userIds: string[] }): Promise<ApiResponse<void>> {
  return request.post('/system/sysRole/editRoleUserRelation', {
    roleId: data.roleId,
    userIdList: data.userIds.map(Number)
  })
}

/**
 * 分配菜单权限给角色
 */
export function assignMenus(data: { roleId: string | number; menuIds: string[] }): Promise<ApiResponse<void>> {
  return request.post('/system/sysRole/editRoleMenuRelation', {
    roleId: data.roleId,
    menuIdList: data.menuIds.map(Number)
  })
}

export function getRoleMenuIds(roleId: string | number): Promise<ApiResponse<string[]>> {
  return request.get(`/system/sysRole/menuIds/${roleId}`)
}

export function getRoleUserIds(roleId: string | number): Promise<ApiResponse<string[]>> {
  return request.get(`/system/sysRole/userIds/${roleId}`)
}

/**
 * 获取所有角色选项（用于下拉选择）
 * 使用 /system/sysRole/list 接口获取角色列表
 */
export function getAllRoleOptions(): Promise<ApiResponse<SysRole[]>> {
  return request.get('/system/sysRole/list')
}
