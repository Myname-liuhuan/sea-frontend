/**
 * 节点 ID 工具：bpmn-js 默认生成的 ID 是 `Activity_<random>` 风格，
 * 区分度低。我们提供一个工具：
 *   - regenerateAllIds(modeler)：遍历所有元素，按类型前缀 + 顺序号重写 ID
 *   - nextIdFor(type)：返回下一个可用的 ID
 *
 * 不替换 bpmn-js 默认 IdGenerator（diagram-js 把 IdGenerator 当全局单例，
 * 替换风险大），改成由用户在工具栏点"批量重置 ID"按钮触发。
 */

const PREFIX_MAP: Record<string, string> = {
  'bpmn:StartEvent': 'StartEvent',
  'bpmn:EndEvent': 'EndEvent',
  'bpmn:IntermediateThrowEvent': 'IntermediateEvent',
  'bpmn:IntermediateCatchEvent': 'IntermediateEvent',
  'bpmn:BoundaryEvent': 'BoundaryEvent',
  'bpmn:UserTask': 'UserTask',
  'bpmn:ServiceTask': 'ServiceTask',
  'bpmn:ScriptTask': 'ScriptTask',
  'bpmn:ManualTask': 'ManualTask',
  'bpmn:BusinessRuleTask': 'BusinessRuleTask',
  'bpmn:SendTask': 'SendTask',
  'bpmn:ReceiveTask': 'ReceiveTask',
  'bpmn:CallActivity': 'CallActivity',
  'bpmn:SubProcess': 'SubProcess',
  'bpmn:ExclusiveGateway': 'ExclusiveGateway',
  'bpmn:ParallelGateway': 'ParallelGateway',
  'bpmn:InclusiveGateway': 'InclusiveGateway',
  'bpmn:EventBasedGateway': 'EventBasedGateway',
  'bpmn:ComplexGateway': 'ComplexGateway',
  'bpmn:SequenceFlow': 'Flow',
  'bpmn:DataObjectReference': 'DataObject',
  'bpmn:DataStoreReference': 'DataStore',
  'bpmn:Process': 'Process',
  'bpmn:Participant': 'Participant',
  'bpmn:Lane': 'Lane',
  'bpmn:TextAnnotation': 'Annotation',
  'bpmn:Group': 'Group',
}

const DEFAULT_PREFIX = 'Element'

/**
 * 给定 element.type 返回 ID 前缀。
 */
export function getIdPrefix(type: string): string {
  return PREFIX_MAP[type] ?? DEFAULT_PREFIX
}

/**
 * 给定 type 和序号，返回 "Prefix_n"。
 */
export function makeId(type: string, counter: number): string {
  return `${getIdPrefix(type)}_${counter}`
}

type ModelerLike = {
  get: (name: string) => unknown
}

/**
 * 遍历 modeler 画布所有元素，按类型分组后批量改名。
 * 使用 commandStack 让操作可撤销。
 */
export function regenerateAllIds(modeler: ModelerLike): void {
  const canvas = modeler.get('canvas') as {
    getRootElement: () => { id: string } | null
  }
  const elementRegistry = modeler.get('elementRegistry') as {
    filter: (
      predicate: (el: { type?: string }) => boolean,
    ) => Array<{ id: string; type: string; businessObject: { id: string } }>
  }
  const modeling = modeler.get('modeling') as {
    updateProperties: (el: unknown, props: Record<string, unknown>) => void
  }
  const moddle = modeler.get('moddle') as {
    ids: {
      unclaim: (id: string) => void
      claim: (id: string, el: unknown) => void
    }
  }

  const rootElement = canvas.getRootElement()
  if (!rootElement) return

  const counters = new Map<string, number>()
  const elements = elementRegistry.filter((el) => {
    return Boolean(el.type && PREFIX_MAP[el.type])
  })

  for (const el of elements) {
    const prefix = getIdPrefix(el.type)
    const next = (counters.get(prefix) ?? 0) + 1
    counters.set(prefix, next)
    const newId = makeId(el.type, next)
    if (newId === el.id) continue

    // 释放旧 id，注册新 id
    try {
      moddle.ids.unclaim(el.id)
    } catch {
      /* ignore */
    }
    try {
      moddle.ids.claim(newId, el)
    } catch {
      // 新 id 已被占用就跳过
      continue
    }

    modeling.updateProperties(el, { id: newId })
  }
}