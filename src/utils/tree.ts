export interface TreeNode {
  id: number | string
  icon?: string
  children?: TreeNode[]
}

export interface TreeNodeDisplay {
  id: string
  [key: string]: unknown
  children?: TreeNodeDisplay[]
}

/**
 * 将 SysMenu 节点转换为 a-tree 可消费的展示节点。
 * - id 转为 string（a-tree 要求）
 * - 显式排除 icon：a-tree 把 icon 当 render function 调用，后端存的是字符串，
 *   透传会导致 Invalid prop 错误 + TreeNode 渲染崩溃 + 树空白
 */
export function toTreeNodeDisplay<T extends TreeNode>(node: T): TreeNodeDisplay {
  if (!node) return node as unknown as TreeNodeDisplay
  const { children, ...rest } = node
  const result: TreeNodeDisplay = { ...rest, id: String(node.id) }
  // a-tree 把 icon 当 render function 调用，后端存的是字符串不能透传
  delete (result as Record<string, unknown>).icon
  if (children && Array.isArray(children)) {
    result.children = children.map(toTreeNodeDisplay)
  }
  return result
}
