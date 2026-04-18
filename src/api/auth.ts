import request from '@/utils/request'
import type { ApiResponse, LoginDTO, LoginResult, LoginUser, SysMenu } from '@/types'

/**
 * 用户登录
 */
export function login(data: LoginDTO): Promise<ApiResponse<LoginResult>> {
  return request.post('/auth/login', data)
}

/**
 * 获取当前登录用户信息
 */
export function getLoginUser(): Promise<ApiResponse<LoginUser>> {
  return request.get('/auth/userinfo')
}

/**
 * 获取当前用户的菜单树
 */
export function getMyMenuTree(): Promise<ApiResponse<SysMenu[]>> {
  return request.get('/system/menu/my')
}

/**
 * 刷新 Token
 */
export function refreshToken(): Promise<ApiResponse<LoginResult>> {
  return request.post('/auth/refresh')
}
