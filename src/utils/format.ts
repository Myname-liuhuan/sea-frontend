import {
  STATUS_LABELS,
  MENU_TYPE_LABELS,
} from '@/constants'

export function formatEntityStatus(status: string): string {
  return STATUS_LABELS[status] ?? ''
}

export function formatMenuType(type: string | number): string {
  return MENU_TYPE_LABELS[String(type)] ?? ''
}

export function formatVisible(visible: string | number): string {
  return String(visible) === '0' ? '显示' : '隐藏'
}
