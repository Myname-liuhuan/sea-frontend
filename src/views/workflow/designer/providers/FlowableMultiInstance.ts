/**
 * Flowable 多实例配置：在活动节点加 multiInstance 配置组。
 *
 * 多实例适用于大多数活动节点（UserTask / ServiceTask / SubProcess / CallActivity 等），
 * 不适用于 StartEvent / EndEvent。
 *
 * 字段（基于标准 BPMN MultiInstanceLoopCharacteristics + flowable 扩展）：
 * - sequential        : boolean，是否串行（默认 false = 并行）
 * - loopCardinality   : 集合大小表达式，如 ${count}
 * - inputDataItem     : 输入集合变量名
 * - outputDataItem    : 输出聚合变量名
 * - completionCondition: 完成条件表达式，如 ${nrOfCompletedInstances/nrOfInstances >= 0.6}
 *
 * 用法（在 FlowableProperties 里）：
 *   if (isActivity(element)) entries.push(multiInstanceEntry(element))
 */

import {
  CheckboxEntry,
  TextFieldEntry,
  isCheckboxEntryEdited,
  isTextFieldEntryEdited,
} from '@bpmn-io/properties-panel'

type Element = {
  type?: string
  businessObject?: { get?: (k: string) => unknown }
  $modeler?: { get: (n: string) => unknown }
}

const ACTIVITY_TYPES = [
  'bpmn:UserTask',
  'bpmn:ServiceTask',
  'bpmn:ScriptTask',
  'bpmn:ManualTask',
  'bpmn:BusinessRuleTask',
  'bpmn:SendTask',
  'bpmn:ReceiveTask',
  'bpmn:CallActivity',
  'bpmn:SubProcess',
]

export const isMultiInstanceCapable = (el: Element): boolean =>
  Boolean(el?.type) && ACTIVITY_TYPES.includes(el.type as string)

function getBo(element: Element): BusinessObject {
  return element.businessObject ?? (element as unknown as BusinessObject)
}

interface BusinessObject {
  get?: (k: string) => unknown
  set?: (k: string, v: unknown) => void
  $modeler?: { get: (n: string) => unknown }
  [key: string]: unknown
}

function getModeler(element: Element): {
  commandStack?: { execute: (cmd: string, ctx: unknown) => void }
  moddle?: {
    create: (type: string, props?: Record<string, unknown>) => unknown
  }
} {
  const modeler = element.$modeler ?? getBo(element).$modeler
  return {
    commandStack: modeler?.get?.('commandStack') as never,
    moddle: modeler?.get?.('moddle') as never,
  }
}

/**
 * 多实例配置组：sequential / loopCardinality / inputDataItem / outputDataItem / completionCondition
 */
export function multiInstanceEntry(element: Element): unknown {
  return {
    id: 'multiInstance',
    label: '多实例',
    entries: buildMultiInstanceEntries(element),
  }
}

/** 把每个字段的 entry 配置独立成函数，控制行数 */
function buildMultiInstanceEntries(element: Element): unknown[] {
  return [
    sequentialEntry(element),
    loopCardinalityEntry(element),
    inputDataItemEntry(element),
    outputDataItemEntry(element),
    completionConditionEntry(element),
  ]
}

function sequentialEntry(element: Element): unknown {
  return {
    id: 'multiInstance-sequential',
    component: CheckboxEntry,
    isEdited: isCheckboxEntryEdited,
    label: '串行执行',
    getValue: () => {
      const mi = getBo(element).loopCharacteristics as
        | { sequential?: boolean }
        | undefined
      return mi?.sequential === true
    },
    setValue: (value: boolean) =>
      updateMultiInstance(element, { sequential: value }),
  }
}

function loopCardinalityEntry(element: Element): unknown {
  return {
    id: 'multiInstance-loopCardinality',
    component: TextFieldEntry,
    isEdited: isTextFieldEntryEdited,
    label: '集合大小',
    placeholder: '${count} 或固定数字',
    getValue: () => (getLoopCardinality(element) as { body?: string } | undefined)?.body ?? '',
    setValue: (value: string) => updateLoopCardinality(element, value || undefined),
  }
}

function inputDataItemEntry(element: Element): unknown {
  return {
    id: 'multiInstance-inputDataItem',
    component: TextFieldEntry,
    isEdited: isTextFieldEntryEdited,
    label: '输入集合',
    placeholder: '${users}（变量名 / 表达式）',
    getValue: () =>
      (getInputDataItem(element) as { name?: string } | undefined)?.name ?? '',
    setValue: (value: string) =>
      updateInputDataItem(element, value || undefined),
  }
}

function outputDataItemEntry(element: Element): unknown {
  return {
    id: 'multiInstance-outputDataItem',
    component: TextFieldEntry,
    isEdited: isTextFieldEntryEdited,
    label: '输出聚合',
    placeholder: 'results（变量名）',
    getValue: () =>
      (getOutputDataItem(element) as { name?: string } | undefined)?.name ?? '',
    setValue: (value: string) =>
      updateOutputDataItem(element, value || undefined),
  }
}

function completionConditionEntry(element: Element): unknown {
  return {
    id: 'multiInstance-completionCondition',
    component: TextFieldEntry,
    isEdited: isTextFieldEntryEdited,
    label: '完成条件',
    placeholder: '${nrOfCompletedInstances/nrOfInstances >= 0.6}',
    getValue: () =>
      (getCompletionCondition(element) as { body?: string } | undefined)?.body ?? '',
    setValue: (value: string) =>
      updateCompletionCondition(element, value || undefined),
  }
}

// =====================================================================
// 内部 helpers
// =====================================================================

function getLoopCharacteristics(element: Element):
  | Record<string, unknown>
  | undefined {
  return getBo(element).loopCharacteristics as
    | Record<string, unknown>
    | undefined
}

function ensureLoopCharacteristics(element: Element): Record<string, unknown> {
  const existing = getLoopCharacteristics(element)
  if (existing) return existing
  const { commandStack, moddle } = getModeler(element)
  if (!commandStack || !moddle) return {}
  const mi = moddle.create(
    'bpmn:MultiInstanceLoopCharacteristics',
    {},
  ) as Record<string, unknown>
  commandStack.execute('element.update-moddle-properties', {
    element,
    moddle,
    properties: { loopCharacteristics: mi },
  })
  return mi
}

function clearLoopCharacteristics(element: Element): void {
  const { commandStack, moddle } = getModeler(element)
  if (!commandStack || !moddle) return
  commandStack.execute('element.update-moddle-properties', {
    element,
    moddle,
    properties: { loopCharacteristics: undefined },
  })
}

function updateMultiInstance(
  element: Element,
  patch: Record<string, unknown>,
): void {
  const mi = ensureLoopCharacteristics(element)
  const { commandStack, moddle } = getModeler(element)
  if (!commandStack || !moddle) return
  // 串行 = false 时直接清空 multiInstance（避免无效配置）
  if (patch.sequential === false && isAllFieldsEmpty(mi)) {
    clearLoopCharacteristics(element)
    return
  }
  const updated = { ...mi, ...patch }
  commandStack.execute('element.update-moddle-properties', {
    element,
    moddle,
    properties: { loopCharacteristics: updated },
  })
}

function isAllFieldsEmpty(mi: Record<string, unknown>): boolean {
  return (
    !mi.loopCardinality &&
    !mi.inputDataItem &&
    !mi.outputDataItem &&
    !mi.completionCondition
  )
}

function getLoopCardinality(element: Element): unknown {
  return getLoopCharacteristics(element)?.loopCardinality
}

function updateLoopCardinality(
  element: Element,
  body: string | undefined,
): void {
  const mi = ensureLoopCharacteristics(element)
  const { commandStack, moddle } = getModeler(element)
  if (!commandStack || !moddle) return
  const updated: Record<string, unknown> = { ...mi }
  if (body) {
    updated.loopCardinality = moddle.create('bpmn:FormalExpression', { body })
  } else {
    delete updated.loopCardinality
  }
  commandStack.execute('element.update-moddle-properties', {
    element,
    moddle,
    properties: { loopCharacteristics: updated },
  })
}

function getInputDataItem(element: Element): unknown {
  return getLoopCharacteristics(element)?.inputDataItem
}

function updateInputDataItem(
  element: Element,
  name: string | undefined,
): void {
  const mi = ensureLoopCharacteristics(element)
  const { commandStack, moddle } = getModeler(element)
  if (!commandStack || !moddle) return
  const updated: Record<string, unknown> = { ...mi }
  if (name) {
    updated.inputDataItem = moddle.create('bpmn:DataInput', { name })
  } else {
    delete updated.inputDataItem
  }
  commandStack.execute('element.update-moddle-properties', {
    element,
    moddle,
    properties: { loopCharacteristics: updated },
  })
}

function getOutputDataItem(element: Element): unknown {
  return getLoopCharacteristics(element)?.outputDataItem
}

function updateOutputDataItem(
  element: Element,
  name: string | undefined,
): void {
  const mi = ensureLoopCharacteristics(element)
  const { commandStack, moddle } = getModeler(element)
  if (!commandStack || !moddle) return
  const updated: Record<string, unknown> = { ...mi }
  if (name) {
    updated.outputDataItem = moddle.create('bpmn:DataOutput', { name })
  } else {
    delete updated.outputDataItem
  }
  commandStack.execute('element.update-moddle-properties', {
    element,
    moddle,
    properties: { loopCharacteristics: updated },
  })
}

function getCompletionCondition(element: Element): unknown {
  return getLoopCharacteristics(element)?.completionCondition
}

function updateCompletionCondition(
  element: Element,
  body: string | undefined,
): void {
  const mi = ensureLoopCharacteristics(element)
  const { commandStack, moddle } = getModeler(element)
  if (!commandStack || !moddle) return
  const updated: Record<string, unknown> = { ...mi }
  if (body) {
    updated.completionCondition = moddle.create('bpmn:FormalExpression', {
      body,
    })
  } else {
    delete updated.completionCondition
  }
  commandStack.execute('element.update-moddle-properties', {
    element,
    moddle,
    properties: { loopCharacteristics: updated },
  })
}