import { ref, computed, onMounted, onUnmounted } from 'vue'
import { getUnreadCount, getInAppMessages, markMessageRead, markAllRead } from '@/api/workflow/notification'
import type { InAppMessage } from '@/types/workflow'
import { RESPONSE_CODE } from '@/constants'

/**
 * 站内信铃铛。
 *
 * <p>前端 ws/notify 建立订阅收到推送 → reloadUnreadCount 自增 1；
 * 点击下拉时拉一次最近 10 条；标已读调 /messages/{id}/read 或 /read-all。
 */
export function useNotificationBell() {
  const unread = ref(0)
  const inboxOpen = ref(false)
  const recent = ref<InAppMessage[]>([])
  const inboxLoading = ref(false)
  let pollTimer: ReturnType<typeof setInterval> | null = null

  const unreadLabel = computed(() => (unread.value > 99 ? '99+' : String(unread.value)))

  async function reloadUnread() {
    try {
      const res = await getUnreadCount()
      if (res.code === RESPONSE_CODE.SUCCESS && typeof res.data === 'number') {
        unread.value = res.data
      }
    } catch (e) {
      // swallow
    }
  }

  async function openInbox() {
    inboxOpen.value = !inboxOpen.value
    if (!inboxOpen.value) return
    inboxLoading.value = true
    try {
      const res = await getInAppMessages(1, 10)
      if (res.code === RESPONSE_CODE.SUCCESS && res.data) {
        recent.value = res.data.rows
      }
    } finally {
      inboxLoading.value = false
    }
  }

  async function onRead(id: number) {
    const res = await markMessageRead(id)
    if (res.code === RESPONSE_CODE.SUCCESS) {
      const m = recent.value.find((x) => x.id === id)
      if (m) m.readFlag = 1
      await reloadUnread()
    }
  }

  async function onReadAll() {
    const res = await markAllRead()
    if (res.code === RESPONSE_CODE.SUCCESS) {
      recent.value = recent.value.map((m) => ({ ...m, readFlag: 1 }))
      unread.value = 0
    }
  }

  /** ws 推送过来时调用 */
  function onWsPush() {
    unread.value += 1
  }

  onMounted(() => {
    reloadUnread()
    pollTimer = setInterval(reloadUnread, 60_000)
  })
  onUnmounted(() => {
    if (pollTimer) clearInterval(pollTimer)
  })

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
    onWsPush,
  }
}
