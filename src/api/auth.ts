import request from '@/utils/request'
import type { ApiResponse, LoginDTO, LoginResult } from '@/types'

/**
 * 用户登录
 */
export function login(data: LoginDTO): Promise<ApiResponse<LoginResult>> {
  return request.post('/auth/login', {
    ...data,
    refreshToken: data.refreshToken || ''
  })
}

/**
 * 刷新 Token
 */
export function refreshToken(): Promise<ApiResponse<LoginResult>> {
  return request.post('/auth/refresh')
}
