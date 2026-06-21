import axios from 'axios'
import type { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios'
import { Message } from '@arco-design/web-vue'
import router, { resetDynamicRoutes } from '@/router'
import { useUserStore } from '@/store/user'
import { RESPONSE_CODE, HTTP_STATUS, REQUEST_TIMEOUT_MS } from '@/constants'

const service: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: REQUEST_TIMEOUT_MS,
})

// Request interceptor
service.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token')
    if (token && token !== 'undefined' && token !== 'null') {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor
service.interceptors.response.use(
  (response: AxiosResponse) => {
    const { data } = response
    // 显式判断：code 字段存在且不等于 SUCCESS（200）时视为错误
    // 后端语义：code=200 成功；code 缺失或非 200 视为失败
    if (data?.code !== undefined && data.code !== RESPONSE_CODE.SUCCESS) {
      Message.error(data.message || '请求失败')
      return Promise.reject(new Error(data.message || 'Error'))
    }
    return data
  },
  (error) => {
    const status = error.response?.status
    const messages: Record<number, string> = {
      [HTTP_STATUS.UNAUTHORIZED]: '未授权，请重新登录',
      [HTTP_STATUS.FORBIDDEN]: '拒绝访问',
      [HTTP_STATUS.NOT_FOUND]: '请求资源不存在',
      [HTTP_STATUS.INTERNAL_ERROR]: '服务器内部错误',
    }
    if (status === HTTP_STATUS.UNAUTHORIZED) {
      const userStore = useUserStore()
      userStore.clearToken()
      resetDynamicRoutes()
      router.push({ name: 'Login' })
    } else {
      Message.error(messages[status] || `请求失败: ${error.message}`)
    }
    return Promise.reject(error)
  }
)

export default service
