/**
 * Flowable 监听器编辑器：基于 bpmn-js-properties-panel ListEntry
 * 把 flowable:ExecutionListener / flowable:TaskListener 列表渲染成可增删改的折叠组。
 *
 * - ExecutionListener 适用：bpmn:Process / bpmn:Task / bpmn:StartEvent / bpmn:EndEvent 等大多数节点
 * - TaskListener 仅适用：bpmn:UserTask
 *
 * 字段：event / class / expression / delegateExpression
 *
 * 用法：
 *   entries.push(executionListenersEntry(element))
 *   if (element.type === 'bpmn:UserTask') entries.push(taskListenersEntry(element))
 */

import {
  ListEntry,
  SelectEntry,
  TextFieldEntry,
  isSelectEntryEdited,
  isTextFieldEntryEdited,
} from '@bpmn-io/properties-panel'

type Element = ElementWithModeler

const EXEC_EVENTS = [
  { value: 'start', label: '开始（start）' },
  { value: 'end', label: '结束（end）' },
  { value: 'take', label: '经过连线（take）' },
]

const TASK_EVENTS = [
  { value: 'create', label: '创建（create）' },
  { value: 'assignment', label: '分配（assignment）' },
  { value: 'complete', label: '完成（complete）' },
  { value: 'delete', label: '删除（delete）' },
]

function getBo(element: ElementWithModeler): BusinessObject {
  return element.businessObject ?? (element as unknown as BusinessObject)
}

interface BusinessObject {
  get?: (k: string) => unknown
  set?: (k: string, v: unknown) => void
  $modeler?: { get: (n: string) => unknown }
  [key: string]: unknown
}

function getModeler(element: ElementWithModeler): {
  commandStack?: { execute: (cmd: string, ctx: unknown) => void }
  moddle?: { create: (type: string, props?: Record<string, unknown>) => unknown }
} {
  const modeler = element.$modeler ?? getBo(element).$modeler
  return {
    commandStack: modeler?.get?.('commandStack') as never,
    moddle: modeler?.get?.('moddle') as never,
  }
}

type ElementWithModeler = {
  type?: string
  businessObject?: { get?: (k: string) => unknown }
  $modeler?: { get: (n: string) => unknown }
}

/**
 * 更新指定 index 监听器的某个字段。
 */
function updateListener(
  element: ElementWithModeler,
  field: 'executionListener' | 'taskListener',
  index: number,
  patch: Record<string, unknown>,
): void {
  const bo = getBo(element) as { get?: (k: string) => unknown }
  const list = ((bo.get?.(field) ?? []) as unknown[]).slice()
  list[index] = { ...(list[index] as Record<string, unknown>), ...patch }
  const { commandStack, moddle } = getModeler(element)
  if (!commandStack || !moddle) return
  commandStack.execute('element.update-moddle-properties', {
    element,
    moddle,
    properties: { [field]: list },
  })
}

/**
 * 单条 ExecutionListener 的展开内容：event / class / expression / delegateExpression
 */
export function executionListenerChildren(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  element: any,
  index: number,
): unknown[] {
  return buildListenerEntries({
    element,
    index,
    field: 'executionListener',
    eventOptions: EXEC_EVENTS,
    defaultEvent: 'start',
    idPrefix: 'el',
  })
}

/**
 * 单条 TaskListener 的展开内容
 */
export function taskListenerChildren(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  element: any,
  index: number,
): unknown[] {
  return buildListenerEntries({
    element,
    index,
    field: 'taskListener',
    eventOptions: TASK_EVENTS,
    defaultEvent: 'create',
    idPrefix: 'tl',
  })
}

interface BuildListenerOpts {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  element: any
  index: number
  field: 'executionListener' | 'taskListener'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  eventOptions: any[]
  defaultEvent: string
  idPrefix: 'el' | 'tl'
}

/** Listener 的字段配置构造工厂 */
function buildListenerEntries(opts: BuildListenerOpts): unknown[] {
  const { element, index, field, eventOptions, defaultEvent, idPrefix } = opts
  const list = (getBo(element)[field] ?? []) as Array<Record<string, unknown>>
  const item = list[index] ?? {}
  return [
    {
      id: `${idPrefix}-${index}-event`,
      component: SelectEntry,
      isEdited: isSelectEntryEdited,
      label: '事件',
      options: eventOptions,
      getValue: () => (item.event ?? defaultEvent) as string,
      setValue: (v: string) => updateListener(element, field, index, { event: v }),
    },
    {
      id: `${idPrefix}-${index}-class`,
      component: TextFieldEntry,
      isEdited: isTextFieldEntryEdited,
      label: 'Class',
      placeholder: '完整类名',
      getValue: () => (item.class ?? '') as string,
      setValue: (v: string) =>
        updateListener(element, field, index, { class: v || undefined }),
    },
    {
      id: `${idPrefix}-${index}-expression`,
      component: TextFieldEntry,
      isEdited: isTextFieldEntryEdited,
      label: 'Expression',
      placeholder: '${bean.execute(execution)}',
      getValue: () => (item.expression ?? '') as string,
      setValue: (v: string) =>
        updateListener(element, field, index, { expression: v || undefined }),
    },
    {
      id: `${idPrefix}-${index}-delegateExpression`,
      component: TextFieldEntry,
      isEdited: isTextFieldEntryEdited,
      label: 'DelegateExpression',
      placeholder: '${myListener}',
      getValue: () => (item.delegateExpression ?? '') as string,
      setValue: (v: string) =>
        updateListener(element, field, index, {
          delegateExpression: v || undefined,
        }),
    },
  ]
}

/**
 * ExecutionListener 列表的 ListEntry 包装
 */
export function executionListenersEntry(element: Element): unknown {
  return {
    id: 'executionListeners',
    component: ListEntry,
    label: '执行监听器',
    shouldSort: false,
    autoFocusEntry: true,
    getValue: () =>
      (getBo(element).executionListener ?? []) as unknown[],
    setValue: (newList: unknown[]) => {
      const { commandStack, moddle } = getModeler(element)
      if (!commandStack || !moddle) return
      commandStack.execute('element.update-moddle-properties', {
        element,
        moddle,
        properties: { executionListener: newList },
      })
    },
    items: () => [
      {
        id: 'executionListener-0',
        component: TextFieldEntry,
        isEdited: isTextFieldEntryEdited,
        shouldSort: false,
        label: '',
        getValue: () => '',
        setValue: () => undefined,
      },
    ],
  }
}

/**
 * TaskListener 列表的 ListEntry 包装
 */
export function taskListenersEntry(element: Element): unknown {
  return {
    id: 'taskListeners',
    component: ListEntry,
    label: '任务监听器',
    shouldSort: false,
    autoFocusEntry: true,
    getValue: () => (getBo(element).taskListener ?? []) as unknown[],
    setValue: (newList: unknown[]) => {
      const { commandStack, moddle } = getModeler(element)
      if (!commandStack || !moddle) return
      commandStack.execute('element.update-moddle-properties', {
        element,
        moddle,
        properties: { taskListener: newList },
      })
    },
    items: () => [
      {
        id: 'taskListener-0',
        component: TextFieldEntry,
        isEdited: isTextFieldEntryEdited,
        shouldSort: false,
        label: '',
        getValue: () => '',
        setValue: () => undefined,
      },
    ],
  }
}