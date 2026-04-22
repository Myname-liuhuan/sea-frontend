import request from '@/utils/request'
import type { ApiResponse, SysMenu, SysMenuDTO } from '@/types'

/**
 * 获取当前用户的菜单树
 */
export function getMyMenuTree(): Promise<ApiResponse<SysMenu[]>> {
  return request.get('/system/sysMenu/myMenuTree')
}

/**
 * 获取所有菜单树（用于菜单管理）
 */
export function getAllMenuTree(): Promise<ApiResponse<SysMenu[]>> {
  return request.get('/system/sysMenu/allMenuTree')
}

/**
 * 获取菜单详情
 */
export function getMenu(menuId: number): Promise<ApiResponse<SysMenu>> {
  return request.get(`/system/menu/${menuId}`)
}

/**
 * 新增菜单
 */
export function addMenu(data: SysMenuDTO): Promise<ApiResponse<void>> {
  return request.post('/system/menu', data)
}

/**
 * 修改菜单
 */
export function updateMenu(data: SysMenuDTO): Promise<ApiResponse<void>> {
  return request.put('/system/menu', data)
}

/**
 * 删除菜单
 */
export function deleteMenu(menuId: number): Promise<ApiResponse<void>> {
  return request.delete(`/system/menu/${menuId}`)
}

/**
 * 获取所有菜单选项（用于表单选择）
 */
export function getMenuOptions(): Promise<ApiResponse<SysMenu[]>> {
  return request.get('/system/menu/options')
}
