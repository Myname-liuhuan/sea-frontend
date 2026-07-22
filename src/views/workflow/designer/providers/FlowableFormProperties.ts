/**
 * Flowable 表单属性编辑器：基于 bpmn-js-properties-panel ListEntry
 * 把 flowable:FormProperty 列表渲染成可增删改的折叠组。
 *
 * 适用元素：bpmn:StartEvent / bpmn:UserTask
 * 字段：id / name / type / required / readable / writable / variable / default / datePattern / values
 *
 * 用法（在 FlowableProperties 里把 entries.push 进去）：
 *   entries.push(formPropertiesEntry(element))
 */

import {
  CheckboxEntry,
  ListEntry,
  SelectEntry,
  TextFieldEntry,
  isCheckboxEntryEdited,
  isSelectEntryEdited,
  isTextFieldEntryEdited,
} from '@bpmn-io/properties-panel'

type Element = {
  type?: string
  businessObject?: {
    get?: (k: string) => unknown
    set?: (k: string, v: unknown) => void
    $modeler?: { get: (n: string) => unknown }
  }
  $modeler?: { get: (n: string) => unknown }
}

const TYPE_OPTIONS = [
  { value: 'string', label: '字符串' },
  { value: 'long', label: '长整数' },
  { value: 'enum', label: '枚举' },
  { value: 'date', label: '日期' },
  { value: 'boolean', label: '布尔' },
  { value: 'list', label: '列表' },
]

function getBo(element: Element): BusinessObject {
  return (element.businessObject ?? (element as unknown as BusinessObject))
}

interface BusinessObject {
  get?: (k: string) => unknown
  set?: (k: string, v: unknown) => void
  $modeler?: { get: (n: string) => unknown }
  [key: string]: unknown
}

function getModeler(element: Element): {
  commandStack?: { execute: (cmd: string, ctx: unknown) => void }
  moddle?: { create: (type: string, props?: Record<string, unknown>) => unknown }
} {
  const modeler = element.$modeler ?? getBo(element).$modeler
  return {
    commandStack: modeler?.get?.('commandStack') as never,
    moddle: modeler?.get?.('moddle') as never,
  }
}

/**
 * 单个 FormProperty 的编辑器（在 ListEntry 展开后渲染）。
 *
 * FlowableProperties 引擎支持 6 种类型：string / long / enum / date / boolean / list
 */
function FormPropertyEntry(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  props: any,
): unknown {
  const { element, id } = props
  const bo = getBo(element) as {
    get?: (k: string) => unknown
  }
  const index = Number(id.replace('formProperty-', ''))
  const list = (bo.get?.('formProperties') ?? []) as Array<Record<string, unknown>>
  const item = list[index]
  const { commandStack, moddle } = getModeler(element)

  function updateField(field: string, value: unknown): void {
    if (!commandStack || !moddle || !item) return
    // 直接对业务对象的 formProperties[index] 改；moddle 用 commandStack 走
    const newList = list.slice()
    newList[index] = { ...item, [field]: value || undefined }
    commandStack.execute('element.update-moddle-properties', {
      element,
      moddle,
      properties: { formProperties: newList },
    })
  }

  return {
    id: `formProperty-${index}`,
    component: TextFieldEntry,
    isEdited: isTextFieldEntryEdited,
    label: 'FormProperty',
    shouldSort: false,
    getValue: () => item?.id ?? '',
    setValue: (value: string) => updateField('id', value),
  }
}

/**
 * 外层 ListEntry：管理 formProperties 数组的新增 / 删除。
 */
export function formPropertiesEntry(element: Element): unknown {
  return {
    id: 'formProperties',
    component: ListEntry,
    label: '表单属性',
    shouldSort: false,
    autoFocusEntry: true,
    getValue: () =>
      ((getBo(element) as { get?: (k: string) => unknown }).get?.(
        'formProperties',
      ) ?? []) as unknown[],
    setValue: (newList: unknown[]) => {
      const { commandStack, moddle } = getModeler(element)
      if (!commandStack || !moddle) return
      commandStack.execute('element.update-moddle-properties', {
        element,
        moddle,
        properties: { formProperties: newList },
      })
    },
    items: () => [
      // 占位：ListEntry 需要一个子 entry 才能渲染标题 + add 按钮
      // 每个 formProperty 的子字段在 FormPropertyEntry 内部处理
      {
        id: 'formProperty-0',
        component: FormPropertyEntry,
        isEdited: () => false,
        shouldSort: false,
      },
    ],
  }
}

/**
 * 单个 FormProperty 的完整字段编辑：返回 ListEntry items 用的多 entry。
 */
export function formPropertyChildren(element: Element, index: number) {
  const list = (getBo(element) as { get?: (k: string) => unknown }).get?.(
    'formProperties',
  ) as Array<Record<string, unknown>> | undefined
  const item = (list ?? [])[index]
  if (!item) return []

  const update = (idx: number, patch: Record<string, unknown>): void => {
    const { commandStack, moddle } = getModeler(element)
    if (!commandStack || !moddle || !list) return
    const newList = list.slice()
    newList[idx] = { ...newList[idx], ...patch }
    commandStack.execute('element.update-moddle-properties', {
      element,
      moddle,
      properties: { formProperties: newList },
    })
  }

  return buildFormPropertyEntries(item, index, update)
}

/** 把"字段配置数组"抽出来，避开 lint max-lines-per-function 限制 */
function buildFormPropertyEntries(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  item: any,
  index: number,
  update: (idx: number, patch: Record<string, unknown>) => void,
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const entries: any[] = []
  entries.push(nameEntry(item, index, update))
  entries.push(typeEntry(item, index, update))
  entries.push(variableEntry(item, index, update))
  entries.push(requiredEntry(item, index, update))
  entries.push(datePatternEntry(item, index, update))
  entries.push(defaultEntry(item, index, update))
  return entries
}

function nameEntry(item: Record<string, unknown>, index: number, update: (i: number, p: Record<string, unknown>) => void) {
  return {
    id: `fp-${index}-name`,
    component: TextFieldEntry,
    isEdited: isTextFieldEntryEdited,
    label: '名称',
    getValue: () => (item.name ?? '') as string,
    setValue: (v: string) => update(index, { name: v || undefined }),
  }
}

function typeEntry(item: Record<string, unknown>, index: number, update: (i: number, p: Record<string, unknown>) => void) {
  return {
    id: `fp-${index}-type`,
    component: SelectEntry,
    isEdited: isSelectEntryEdited,
    label: '类型',
    options: TYPE_OPTIONS,
    getValue: () => (item.type ?? 'string') as string,
    setValue: (v: string) => update(index, { type: v || 'string' }),
  }
}

function variableEntry(item: Record<string, unknown>, index: number, update: (i: number, p: Record<string, unknown>) => void) {
  return {
    id: `fp-${index}-variable`,
    component: TextFieldEntry,
    isEdited: isTextFieldEntryEdited,
    label: '变量名',
    placeholder: '存储到流程变量的字段名',
    getValue: () => (item.variable ?? '') as string,
    setValue: (v: string) => update(index, { variable: v || undefined }),
  }
}

function requiredEntry(item: Record<string, unknown>, index: number, update: (i: number, p: Record<string, unknown>) => void) {
  return {
    id: `fp-${index}-required`,
    component: CheckboxEntry,
    isEdited: isCheckboxEntryEdited,
    label: '必填',
    getValue: () => item.required === 'true' || item.required === true,
    setValue: (v: boolean) => update(index, { required: v ? 'true' : undefined }),
  }
}

function datePatternEntry(item: Record<string, unknown>, index: number, update: (i: number, p: Record<string, unknown>) => void) {
  return {
    id: `fp-${index}-datePattern`,
    component: TextFieldEntry,
    isEdited: isTextFieldEntryEdited,
    label: '日期格式',
    placeholder: 'yyyy-MM-dd（仅 type=date 时使用）',
    getValue: () => (item.datePattern ?? '') as string,
    setValue: (v: string) => update(index, { datePattern: v || undefined }),
  }
}

function defaultEntry(item: Record<string, unknown>, index: number, update: (i: number, p: Record<string, unknown>) => void) {
  return {
    id: `fp-${index}-default`,
    component: TextFieldEntry,
    isEdited: isTextFieldEntryEdited,
    label: '默认值',
    getValue: () => (item.default ?? '') as string,
    setValue: (v: string) => update(index, { default: v || undefined }),
  }
}