import type { Directive, DirectiveBinding } from 'vue'
import { useMenuStore } from '@/store/menu'
import type { SysMenu } from '@/types'
import { watch } from 'vue'

/**
 * 从菜单树中递归收集所有 perms 权限字符串
 */
function collectPerms(menus: SysMenu[]): string[] {
  const perms: string[] = []
  function traverse(nodes: SysMenu[]) {
    for (const node of nodes) {
      if (node.perms) {
        perms.push(node.perms)
      }
      if (node.children?.length) {
        traverse(node.children)
      }
    }
  }
  traverse(menus)
  return perms
}

/**
 * 检查权限并显示/隐藏元素（使用 v-show，不移除 DOM）
 */
function checkPerm(el: HTMLElement, binding: DirectiveBinding) {
  const requiredPerm = binding.value as string
  if (!requiredPerm) return

  const menuStore = useMenuStore()
  const allPerms = collectPerms(menuStore.menuTree)

  if (!allPerms.includes(requiredPerm)) {
    el.style.display = 'none'
  } else {
    el.style.display = ''
  }
}

/**
 * v-has-permi="'sys:user:delete'"
 * 权限指令：校验当前用户是否拥有指定权限，无权限则隐藏元素
 * 用法：<button v-has-permi="'sys:user:delete'">删除</button>
 */
const vHasPermi: Directive = {
  mounted(el: HTMLElement, binding: DirectiveBinding) {
    const menuStore = useMenuStore()

    // 首次检查
    checkPerm(el, binding)

    // 监听 menuTree 变化，变化后重新检查（解决异步加载时序问题）
    watch(
      () => menuStore.menuTree,
      () => checkPerm(el, binding),
      { deep: true, immediate: false },
    )
  },
}

export default vHasPermi