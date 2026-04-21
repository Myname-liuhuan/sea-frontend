import request from '@/utils/request'
import type { ApiResponse } from '@/types'

export interface SysDept {
  id: number
  parentId: number
  name: string
  orderNum: number
  leader?: string
  mobile?: string
  email?: string
  status: string
  createTime?: string
  children?: SysDept[]
}

export interface SysDeptDTO {
  id?: number
  parentId: number
  name: string
  orderNum?: number
  leader?: string
  mobile?: string
  email?: string
  status?: string
}

/**
 * 获取部门树
 */
export function getDeptTree(): Promise<ApiResponse<SysDept[]>> {
  return request.get('/api/system/sysDept/tree')
}

/**
 * 获取部门详情
 */
export function getDept(id: number): Promise<ApiResponse<SysDept>> {
  return request.get(`/api/system/sysDept/${id}`)
}

/**
 * 新增部门
 */
export function addDept(data: SysDeptDTO): Promise<ApiResponse<void>> {
  return request.post('/api/system/sysDept', data)
}

/**
 * 更新部门
 */
export function updateDept(data: SysDeptDTO): Promise<ApiResponse<void>> {
  return request.put('/api/system/sysDept', data)
}

/**
 * 删除部门
 */
export function deleteDept(id: number): Promise<ApiResponse<void>> {
  return request.delete(`/api/system/sysDept/${id}`)
}

/**
 * 获取部门下拉树
 */
export function getDeptTreeSelect(): Promise<ApiResponse<SysDept[]>> {
  return request.get('/api/system/sysDept/treeSelect')
}
