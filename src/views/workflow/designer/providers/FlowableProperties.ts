/**
 * Flowable Properties 扩展：不用自己的 registerProvider，改为在 DI 里替换
 * 默认 BpmnPropertiesProvider 的 getGroups / getTabs 方法，追加 Flowable group。
 *
 * 优点：完全避开 "Cannot read properties of undefined (reading 'context')"
 * 问题——bpmn-js-properties-panel v5 内部在 __init__ 阶段对新 registerProvider 调用
 * 不友好，旧 BpmnPropertiesProvider 早就被其 own module 注册好，我们只是替换
 * 它的方法，无需 registerProvider 时机。
 *
 * 参考 bpmn-js 社区推荐 pattern：在 additionalModules 里通过 $inject 拿到已有
 * provider 实例，重写其 getGroups 在原 groups 数组后面追加我们自己的 group。
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  CheckboxEntry,
  Group,
  SelectEntry,
  TextFieldEntry,
  isCheckboxEntryEdited,
  isSelectEntryEdited,
  isTextFieldEntryEdited,
} from '@bpmn-io/properties-panel'

type GetGroupsFn = (element: any) => (groups: any[]) => any[]

function isProcess(el: any): boolean {
  return Boolean(el) && el.type === 'bpmn:Process'
}
function isStartEvent(el: any): boolean {
  return Boolean(el) && el.type === 'bpmn:StartEvent'
}
function isUserTask(el: any): boolean {
  return Boolean(el) && el.type === 'bpmn:UserTask'
}
function isServiceTask(el: any): boolean {
  return Boolean(el) && el.type === 'bpmn:ServiceTask'
}
function isSequenceFlow(el: any): boolean {
  return Boolean(el) && el.type === 'bpmn:SequenceFlow'
}

function getBo(element: any): Record<string, unknown> {
  return (element?.businessObject ?? element ?? {}) as Record<string, unknown>
}

function getModelerServices(element: any) {
  const modeler = element?.$modeler
  return {
    commandStack: modeler?.get?.('commandStack'),
    moddle: modeler?.get?.('moddle'),
  }
}

/* ============ Entry 工厂：返回 wrapper 组件 ============
 *
 * bpmn-js-properties-panel v5 的 entry 期望：
 *   { id, component: (props) => preact-element, isEdited: (e) => boolean }
 *
 * 我们写 wrapper 函数，接收 props.element + props.id 等，渲染对应的
 * TextFieldEntry / CheckboxEntry / SelectEntry，自身处理 getValue / setValue。
 */

// h 兼容写法：@bpmn-io/properties-panel 用 preact 的 h 创建元素。
// 直接调 TextFieldEntry({ ... }) 等即可——它们本身就是 function component。
function makeTextFieldWrapper(
  field: string,
  label: string,
  options: { placeholder?: string } = {},
) {
  return function TextFieldWrapper(props: { element: any; id?: string }) {
    const { element } = props
    const { commandStack, moddle } = getModelerServices(element)
    const bo = getBo(element)
    return (TextFieldEntry as any)({
      id: field,
      label,
      placeholder: options.placeholder,
      getValue: () => {
        const v = bo[field]
        return v == null ? '' : String(v)
      },
      setValue: (value: string) => {
        if (!commandStack || !moddle) return
        commandStack.execute('element.update-moddle-properties', {
          element,
          moddle,
          properties: { [field]: value || undefined },
        })
      },
    })
  }
}

function makeCheckboxWrapper(field: string, label: string) {
  return function CheckboxWrapper(props: { element: any }) {
    const { element } = props
    const { commandStack, moddle } = getModelerServices(element)
    const bo = getBo(element)
    return (CheckboxEntry as any)({
      id: field,
      label,
      getValue: () => bo[field] === true,
      setValue: (value: boolean) => {
        if (!commandStack || !moddle) return
        commandStack.execute('element.update-moddle-properties', {
          element,
          moddle,
          properties: { [field]: value ? true : undefined },
        })
      },
    })
  }
}

function makeSelectWrapper(
  field: string,
  label: string,
  options: Array<{ value: string; label: string }>,
) {
  return function SelectWrapper(props: { element: any }) {
    const { element } = props
    const { commandStack, moddle } = getModelerServices(element)
    const bo = getBo(element)
    return (SelectEntry as any)({
      id: field,
      label,
      options,
      getValue: () => {
        const v = bo[field]
        return v == null ? '' : String(v)
      },
      setValue: (value: string) => {
        if (!commandStack || !moddle) return
        commandStack.execute('element.update-moddle-properties', {
          element,
          moddle,
          properties: { [field]: value || undefined },
        })
      },
    })
  }
}

function makeConditionExpressionWrapper() {
  return function ConditionExpressionWrapper(props: { element: any }) {
    const { element } = props
    const { commandStack, moddle } = getModelerServices(element)
    const bo = getBo(element)
    return (TextFieldEntry as any)({
      id: 'conditionExpression',
      label: '条件表达式',
      placeholder: '${amount > 1000}',
      getValue: () => {
        const expr = bo.conditionExpression
        if (typeof expr === 'string') return expr
        return (expr as { body?: string } | undefined)?.body ?? ''
      },
      setValue: (value: string) => {
        if (!commandStack || !moddle) return
        const properties = value
          ? {
              conditionExpression: moddle.create('bpmn:FormalExpression', {
                body: value,
              }),
            }
          : { conditionExpression: undefined }
        commandStack.execute('element.update-moddle-properties', {
          element,
          moddle,
          properties,
        })
      },
    })
  }
}

function processEntries(): unknown[] {
  return [
    {
      id: 'candidateStarterGroups',
      component: makeTextFieldWrapper('candidateStarterGroups', '可发起角色', {
        placeholder: '逗号分隔，如 hr,manager',
      }),
      isEdited: isTextFieldEntryEdited,
    },
    {
      id: 'candidateStarterUsers',
      component: makeTextFieldWrapper('candidateStarterUsers', '可发起用户', {
        placeholder: '逗号分隔，如 admin,hr_specialist',
      }),
      isEdited: isTextFieldEntryEdited,
    },
    {
      id: 'versionTag',
      component: makeTextFieldWrapper('versionTag', '版本标签'),
      isEdited: isTextFieldEntryEdited,
    },
  ]
}

function startEventEntries(): unknown[] {
  return [
    {
      id: 'initiator',
      component: makeTextFieldWrapper('initiator', '发起人变量', {
        placeholder: '保存到该变量名',
      }),
      isEdited: isTextFieldEntryEdited,
    },
    {
      id: 'formKey',
      component: makeTextFieldWrapper('formKey', '表单 Key', {
        placeholder: '外部表单资源 key',
      }),
      isEdited: isTextFieldEntryEdited,
    },
  ]
}

function userTaskEntries(): unknown[] {
  return [
    t1(), t2(), t3(), t4(), t5(), t6(), chk1()
  ]
}

function t1() {
  return {
    id: 'assignee',
    component: makeTextFieldWrapper('assignee', '审批人', {
      placeholder: '${initiator} 或 userId',
    }),
    isEdited: isTextFieldEntryEdited,
  }
}
function t2() {
  return {
    id: 'candidateUsers',
    component: makeTextFieldWrapper('candidateUsers', '候选人', {
      placeholder: '逗号分隔',
    }),
    isEdited: isTextFieldEntryEdited,
  }
}
function t3() {
  return {
    id: 'candidateGroups',
    component: makeTextFieldWrapper('candidateGroups', '候选组', {
      placeholder: '逗号分隔，如 hr,manager',
    }),
    isEdited: isTextFieldEntryEdited,
  }
}
function t4() {
  return {
    id: 'dueDate',
    component: makeTextFieldWrapper('dueDate', '到期时间', {
      placeholder: 'ISO 或 P3D',
    }),
    isEdited: isTextFieldEntryEdited,
  }
}
function t5() {
  return {
    id: 'priority',
    component: makeTextFieldWrapper('priority', '优先级', {
      placeholder: '0-100',
    }),
    isEdited: isTextFieldEntryEdited,
  }
}
function t6() {
  return {
    id: 'formKey',
    component: makeTextFieldWrapper('formKey', '表单 Key', {
      placeholder: '外部表单资源 key',
    }),
    isEdited: isTextFieldEntryEdited,
  }
}
function chk1() {
  return {
    id: 'flowable:async',
    component: makeCheckboxWrapper('flowable:async', '异步执行'),
    isEdited: isCheckboxEntryEdited,
  }
}



function serviceTaskEntries(): unknown[] {
  return [
    {
      id: 'flowable:type',
      component: makeSelectWrapper('flowable:type', '类型', [
        { value: '', label: '自定义 JavaDelegate' },
        { value: 'mail', label: '邮件' },
        { value: 'http', label: 'HTTP' },
        { value: 'shell', label: 'Shell 脚本' },
        { value: 'dmn', label: 'DMN 决策' },
        { value: 'camel', label: 'Camel 路由' },
        { value: 'mule', label: 'Mule ESB' },
      ]),
      isEdited: isSelectEntryEdited,
    },
    {
      id: 'flowable:async',
      component: makeCheckboxWrapper('flowable:async', '异步执行'),
      isEdited: isCheckboxEntryEdited,
    },
  ]
}

function sequenceFlowEntries(): unknown[] {
  return [
    {
      id: 'conditionExpression',
      component: makeConditionExpressionWrapper(),
      isEdited: isTextFieldEntryEdited,
    },
  ]
}

function buildFlowableGroup(element: any): unknown {
  const entries: unknown[] = []
  if (isProcess(element)) entries.push(...processEntries())
  if (isStartEvent(element)) entries.push(...startEventEntries())
  if (isUserTask(element)) entries.push(...userTaskEntries())
  if (isServiceTask(element)) entries.push(...serviceTaskEntries())
  if (isSequenceFlow(element)) entries.push(...sequenceFlowEntries())

  return {
    id: 'flowable',
    label: 'Flowable',
    entries,
    component: Group,
  }
}

function shouldAddFlowableGroup(element: any): boolean {
  return (
    isProcess(element) ||
    isStartEvent(element) ||
    isUserTask(element) ||
    isServiceTask(element) ||
    isSequenceFlow(element)
  )
}

/* ============ 扩展默认 provider ============ */

/**
 * 通过 DI 拿到 bpmnPropertiesProvider 实例，替换其 getGroups 方法。
 * 这样我们不需要调用 registerProvider（避免时序问题），只是"补丁"了已注册的 provider。
 */
export default class FlowablePropertiesExtension {
  static $inject = ['bpmnPropertiesProvider']

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  bpmnPropertiesProvider: any

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(bpmnPropertiesProvider: any) {
    this.bpmnPropertiesProvider = bpmnPropertiesProvider
    // 替换 getGroups：在原 groups 后追加我们的 Flowable group
    const originalGetGroups: GetGroupsFn = bpmnPropertiesProvider.getGroups
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    bpmnPropertiesProvider.getGroups = (element: any) => {
      // 先调原 getGroups 拿到默认 groups（可能是数组或函数）
      const originalResult = originalGetGroups.call(
        bpmnPropertiesProvider,
        element,
      )
      // 兼容：原 getGroups 可能直接返回 groups 数组，或返回 (groups) => groups 的函数
      if (typeof originalResult === 'function') {
        return (groups: any[]) => {
          const modified = originalResult(groups)
          return this.maybeAppendFlowableGroup(element, modified)
        }
      }
      if (Array.isArray(originalResult)) {
        return this.maybeAppendFlowableGroup(element, originalResult)
      }
      return originalResult
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private maybeAppendFlowableGroup(element: any, groups: any[]): any[] {
    if (!shouldAddFlowableGroup(element)) return groups
    const exists = groups.some(
      (g: { id?: string }) => g?.id === 'flowable',
    )
    if (exists) return groups
    groups.push(buildFlowableGroup(element))
    return groups
  }
}

/**
 * module config：通过 __init__ 在 bpmn-js-properties-panel 注册完自己的
 * bpmnPropertiesProvider 之后，再实例化我们这个 extension 去做"补丁"。
 */
export const FlowablePropertiesModule = {
  __init__: ['flowablePropertiesExtension'],
  flowablePropertiesExtension: ['type', FlowablePropertiesExtension],
}