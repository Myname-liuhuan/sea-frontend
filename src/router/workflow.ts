import type { RouteRecordRaw } from 'vue-router'

/**
 * 工作流相关路由。
 *
 * <p>注：列表页 / 我的申请 / 待我审批 / 工单监控 通过 sys_menu 后端动态注入，
 * 仅 Detail 页需要显式注册（因为它是带 query 参数的临时页）。
 *
 * @author liuhuan
 * @date 2026-07-04
 */
const workflowRoutes: RouteRecordRaw[] = [
  {
    path: '/workflow/detail',
    name: 'WorkflowDetail',
    component: () => import('@/views/workflow/Detail.vue'),
    meta: { title: '工单详情' },
  },
]

export default workflowRoutes
