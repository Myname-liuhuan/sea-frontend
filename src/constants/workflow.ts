/**
 * 工作流域常量（避免 hook / view 出现魔法数字）。
 */

/** 申请原因最长字符数 */
export const APPLY_REASON_MAX_LENGTH = 500

/** 默认铃铛未读上限显示文字 */
export const INBOX_BADGE_MAX = 99

/** 收件箱每页条数 */
export const INBOX_PAGE_SIZE = 10

/** 铃铛未读数轮询周期（60s） */
export const INBOX_POLL_INTERVAL_MS = 60_000

/** 申请幂等键：apply-{userId}-{ts} 命名空间 */
export const APPLY_IDEMPOTENCY_PREFIX = 'apply'

/** 默认页码 */
export const DEFAULT_PAGE_NUM = 1

/** 默认每页条数（列表兜底） */
export const DEFAULT_LIST_PAGE_SIZE = 10

/** 强制改密页：密码最短长度 */
export const MIN_PASSWORD_LENGTH = 8
