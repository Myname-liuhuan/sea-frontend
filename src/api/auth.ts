import request from '@/utils/request'
import type { ApiResponse, LoginDTO, LoginResult } from '@/types'

/**
 * 用户登录
 * 后端 LoginRequest 仅需要 username + password，不需要 refreshToken
 */
export function login(data: LoginDTO): Promise<ApiResponse<LoginResult>> {
  return request.post('/auth/login', data)
}

/**
 * 刷新 Token
 */
export function refreshToken(): Promise<ApiResponse<LoginResult>> {
  return request.post('/auth/refresh')
}
