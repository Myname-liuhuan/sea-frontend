import type { Directive } from 'vue'
import { useMenuStore } from '@/store/menu'

/**
 * 检查权限并显示/隐藏元素。
 *
 * 策略：
 * - O(1) 查 Set：`menuStore.allPerms`（从 menuTree 派生的扁平 Set）
 * - 显示用 `el.hidden = false` + `el.style.removeProperty('display')`，恢复类样式
 * - 隐藏用 `el.hidden = true`（a11y）+ `el.style.display = 'none'`（覆盖 `.btn{display:flex}` 等 class）
 *   ——只用 `el.hidden` 在 `.btn` 这种带 display:flex 的元素上不生效，因为 hidden 默认 UA 样式 display:none 会被 class 覆盖
 */
function checkPerm(el: HTMLElement, requiredPerm: string) {
  const menuStore = useMenuStore()
  const has = menuStore.allPerms.has(requiredPerm)
  if (has) {
    el.hidden = false
    el.style.removeProperty('display')
  } else {
    el.hidden = true
    el.style.display = 'none'
  }
}

/**
 * v-has-permi="'sys:user:delete'"
 * 权限指令
 * 用法：<button v-has-permi="'sys:user:delete'">删除</button>
 */
const vHasPermi: Directive<HTMLElement, string> = {
  mounted(el, binding) {
    const requiredPerm = binding.value
    if (!requiredPerm) return

    const menuStore = useMenuStore()

    // 首次检查
    checkPerm(el, requiredPerm)

    // 订阅 store，菜单树变化时重新检查
    const stop = menuStore.$subscribe(
      () => checkPerm(el, requiredPerm),
      { detached: true },
    )

    // 保存 stop handle，unmounted 时调用避免 watcher 泄漏
    ;(el as HTMLElement & { _permiStop?: () => void })._permiStop = stop
  },

  unmounted(el) {
    const stop = (el as HTMLElement & { _permiStop?: () => void })._permiStop
    if (stop) {
      stop()
      delete (el as HTMLElement & { _permiStop?: () => void })._permiStop
    }
  },
}

export default vHasPermi