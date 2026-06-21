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
 * - 保留所有字段（含 icon），方便编辑时回填
 */
export function toTreeNodeDisplay<T extends TreeNode>(node: T): TreeNodeDisplay {
  if (!node) return node as unknown as TreeNodeDisplay
  const { children, ...rest } = node
  const result: TreeNodeDisplay = { ...rest, id: String(node.id) }
  if (children && Array.isArray(children)) {
    result.children = children.map(toTreeNodeDisplay)
  }
  return result
}
