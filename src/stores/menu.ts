import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { SysMenu } from '@/types'

export const useMenuStore = defineStore('menu', () => {
  const menuTree = ref<SysMenu[]>([])

  function setMenuTree(menus: SysMenu[]) {
    menuTree.value = menus
  }

  function getMenuTree() {
    return menuTree.value
  }

  function clearMenuTree() {
    menuTree.value = []
  }

  return {
    menuTree,
    setMenuTree,
    getMenuTree,
    clearMenuTree,
  }
})
