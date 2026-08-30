import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useUserStore } from '@/store'
import router from '@/router'
import { getUnreadCount, getInAppMessages, markMessageRead, markAllRead } from '@/api/workflow/notification'
import type { InAppMessage } from '@/types/workflow'
import { RESPONSE_CODE } from '@/constants'
import { INBOX_BADGE_MAX, INBOX_PAGE_SIZE, INBOX_POLL_INTERVAL_MS, WS_RECONNECT_DELAY_MS } from '@/constants/workflow'

/**
 * 站内信铃铛。
 *
 * <p>实时性：WebSocket 推送是权威源；轮询仅作 WS 断线兜底（断线 → 启动 60s
 * 轮询；WS 重新建上 → 立刻停轮询）。
 *
 * <p>推送 payload 是单条 InAppMessageVO，前端解析后同步更新未读数与最近列表。
 */
export function useNotificationBell() {
  const userStore = useUserStore()

  const unread = ref(0)
  const inboxOpen = ref(false)
  const recent = ref<InAppMessage[]>([])
  const inboxLoading = ref(false)

  let socket: WebSocket | null = null
  let pollTimer: ReturnType<typeof setInterval> | null = null

  const unreadLabel = computed(() => (unread.value > INBOX_BADGE_MAX ? '99+' : String(unread.value)))

  async function reloadUnread() {
    try {
      const res = await getUnreadCount()
      if (res.code === RESPONSE_CODE.SUCCESS && res.data != null) {
        // 后端可能返回 number 或 string，统一转 number
        const n = Number(res.data)
        if (Number.isFinite(n) && n >= 0) unread.value = n
      }
    } catch {
      // swallow：兜底轮询场景，不让单次失败打断节奏
    }
  }

  async function openInbox() {
    inboxOpen.value = !inboxOpen.value
    if (!inboxOpen.value) return
    inboxLoading.value = true
    try {
      const res = await getInAppMessages(1, INBOX_PAGE_SIZE)
      if (res.code === RESPONSE_CODE.SUCCESS && res.data) {
        recent.value = res.data.rows
      }
    } finally {
      inboxLoading.value = false
    }
  }

  async function onRead(id: number) {
    const res = await markMessageRead(id)
    if (res.code !== RESPONSE_CODE.SUCCESS) return
    const m = recent.value.find((x) => x.id === id)
    if (m && m.readFlag === 0) {
      m.readFlag = 1
      unread.value = Math.max(0, unread.value - 1)
    }
  }

  async function onReadAll() {
    const res = await markAllRead()
    if (res.code !== RESPONSE_CODE.SUCCESS) return
    recent.value = recent.value.map((m) => ({ ...m, readFlag: 1 }))
    unread.value = 0
  }

  /** 解析 WS 推送 payload 并就地更新 UI */
  function handleWsMessage(event: MessageEvent) {
    try {
      const msg = JSON.parse(event.data) as InAppMessage
      if (msg.readFlag === 0) unread.value += 1
      // 插到列表头，超出分页大小就丢最旧
      recent.value = [msg, ...recent.value].slice(0, INBOX_PAGE_SIZE)
    } catch {
      // payload 解析失败当作心跳，刷新一次未读兜底
      reloadUnread()
    }
  }

  function startFallbackPoll() {
    if (pollTimer) return
    pollTimer = setInterval(reloadUnread, INBOX_POLL_INTERVAL_MS)
  }

  function stopFallbackPoll() {
    if (!pollTimer) return
    clearInterval(pollTimer)
    pollTimer = null
  }

  function connectWs() {
    if (socket) return
    const token = userStore.token
    if (!token) return
    const protocol = location.protocol === 'https:' ? 'wss' : 'ws'
    const baseUrl =
      (import.meta.env.VITE_WS_BASE_URL as string | undefined) ||
      `${protocol}://${location.host}`
    // 用 token 而不是 userId：服务端从 JWT 解析 userId，伪造 query 没意义
    const ws = new WebSocket(`${baseUrl}/api/notification/ws/notify?token=${encodeURIComponent(token)}`)
    ws.onopen = () => {
      // WS 建上：拉一次权威未读，停掉兜底轮询
      reloadUnread()
      stopFallbackPoll()
    }
    ws.onmessage = handleWsMessage
    ws.onclose = () => {
      socket = null
      // WS 断了：开兜底轮询，等着重连；连接成功后再关
      startFallbackPoll()
      setTimeout(connectWs, WS_RECONNECT_DELAY_MS)
    }
    ws.onerror = () => {
      try {
        ws.close()
      } catch {
        // swallow：onerror 后 onclose 会兜底清理
      }
    }
    socket = ws
  }

  function disconnectWs() {
    if (socket) {
      socket.close()
      socket = null
    }
    stopFallbackPoll()
  }

  onMounted(() => {
    // 兜底轮询先开：WS 还没建上之前不会丢数据，ws.onopen 一旦触发立刻关
    reloadUnread()
    startFallbackPoll()
    connectWs()
  })

  onUnmounted(() => {
    disconnectWs()
  })

  /**
   * 通知里的跳转链接是否能在当前路由表里命中。
   *
   * <p>后端下发的 msg.link 可能是任意路径（含未注册的），不能跳的就不渲染"查看"按钮，
   * 避免点过去跳 404。router 未就绪（动态路由尚未注入完成）时保守返回 false。
   */
  function canNavigate(link: string | undefined): boolean {
    if (!link) return false
    if (!router.isReady()) return false
    return router.resolve(link).matched.length > 0
  }

  return {
    unread,
    unreadLabel,
    inboxOpen,
    recent,
    inboxLoading,
    reloadUnread,
    openInbox,
    onRead,
    onReadAll,
    canNavigate,
  }
}