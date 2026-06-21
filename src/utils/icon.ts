import * as arcoIcons from '@arco-design/web-vue/es/icon'
import type { Component } from 'vue'

/**
 * 后端返回的图标名称 -> Arco 图标组件名的映射
 * 后端存储的是简化名称，前端需要映射到完整的 Arco 图标组件名
 */
const iconNameMap: Record<string, string> = {
  // 用户管理
  user: 'IconUser',
  User: 'IconUser',
  // 角色管理
  role: 'IconSafe',
  Role: 'IconSafe',
  // 菜单管理
  menu: 'IconMenu',
  Menu: 'IconMenu',
  // 部门管理
  dept: 'IconBranch',
  Dept: 'IconBranch',
  department: 'IconBranch',
  office: 'IconBranch',
  Office: 'IconBranch',
  // 系统设置
  setting: 'IconSettings',
  Setting: 'IconSettings',
  settings: 'IconSettings',
  system: 'IconSettings',
  // 首页
  home: 'IconHome',
  // 日志
  log: 'IconFile',
  logs: 'IconFile',
  // 通用图标
  add: 'IconPlus',
  edit: 'IconEdit',
  delete: 'IconDelete',
  search: 'IconSearch',
  export: 'IconExport',
  import: 'IconImport',
  view: 'IconEye',
  // 文件
  file: 'IconFile',
  image: 'IconImage',
  // 其他
  list: 'IconList',
  tree: 'IconTree',
  dashboard: 'IconDashboard',
  chart: 'IconChart',
  close: 'IconClose',
  check: 'IconCheck',
  refresh: 'IconRefresh',
}

/**
 * 根据后端返回的图标名称获取对应的 Arco 图标组件
 */
export function resolveIcon(iconName?: string): Component | null {
  if (!iconName) return null

  // 先尝试直接映射
  const mappedName = iconNameMap[iconName]
  if (mappedName && (arcoIcons as Record<string, Component>)[mappedName]) {
    return (arcoIcons as Record<string, Component>)[mappedName]
  }

  // 尝试直接在 arcoIcons 中查找（有些图标名可能直接可用）
  const directName = iconName.startsWith('Icon') ? iconName : `Icon${iconName.charAt(0).toUpperCase() + iconName.slice(1)}`
  if ((arcoIcons as Record<string, Component>)[directName]) {
    return (arcoIcons as Record<string, Component>)[directName]
  }

  // 都找不到返回 null
  return null
}
