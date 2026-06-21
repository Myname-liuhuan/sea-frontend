import { defineStore } from 'pinia'
import { ref, computed, type ComputedRef } from 'vue'
import type { SysMenu } from '@/types'

/**
 * 从菜单树递归收集所有 perms 权限字符串
 */
function collectPerms(menus: SysMenu[]): string[] {
  const perms: string[] = []
  for (const node of menus) {
    if (node.perms) {
      perms.push(node.perms)
    }
    if (node.children?.length) {
      perms.push(...collectPerms(node.children))
    }
  }
  return perms
}

export const useMenuStore = defineStore('menu', () => {
  const menuTree = ref<SysMenu[]>([])

  /**
   * 扁平化权限集合：O(N) 派生，避免每个 v-has-permi 元素都重复遍历菜单树
   */
  const allPerms: ComputedRef<Set<string>> = computed(() => new Set(collectPerms(menuTree.value)))

  function setMenuTree(menus: SysMenu[]) {
    menuTree.value = menus
  }

  function clearMenuTree() {
    menuTree.value = []
  }

  return {
    menuTree,
    allPerms,
    setMenuTree,
    clearMenuTree,
  }
})
