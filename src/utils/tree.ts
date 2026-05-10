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

export function removeIconField<T extends TreeNode>(node: T): TreeNodeDisplay {
  if (!node) return node as unknown as TreeNodeDisplay
  const { icon: _, children, ...rest } = node
  const result: TreeNodeDisplay = { ...rest, id: String(node.id) }
  if (children && Array.isArray(children)) {
    result.children = children.map(removeIconField)
  }
  return result
}
