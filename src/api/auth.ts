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

/**
 * 自助改密：sea-system/changePassword?userId=...&oldPassword=...&newPassword=...
 * 强制改密场景下 oldPassword 可空。
 */
export function changePassword(
  userId: number | string,
  newPassword: string,
  oldPassword?: string,
): Promise<ApiResponse<boolean>> {
  const params: Record<string, string> = {
    userId: String(userId),
    newPassword,
  }
  if (oldPassword) params.oldPassword = oldPassword
  return request.get('/system/sysUser/changePassword', { params })
}
