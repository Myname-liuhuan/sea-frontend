/**
 * Flowable 风格 Palette：在 bpmn-js 默认节点基础上补全 Flowable 特有任务，
 * 并把所有分组标签翻译为中文。
 *
 * 用法：
 *   new Modeler({
 *     ...,
 *     additionalModules: [
 *       FlowablePalette,
 *       BpmnPropertiesPanelModule,
 *       BpmnPropertiesProviderModule,
 *     ],
 *   })
 *
 * 设计依据：
 * - Flowable Modeler 默认 palette 几乎和 bpmn-js 一致，差别在于：
 *   1) 文案 (Flowable 是英文但加了 tooltip)
 *   2) MailTask / HttpTask 在 Flowable 是 ServiceTask + delegateExpression，
 *      这里我们暴露 ServiceTask 并提示用户选 type=mail/http
 * - 默认 palette 已经覆盖：StartEvent/EndEvent/IntermediateThrowEvent/TimerEvent/
 *   UserTask/ServiceTask/ScriptTask/ExclusiveGateway/ParallelGateway/InclusiveGateway/
 *   SubProcess/CallActivity/DataObjectReference/DataStoreReference，
 *   这里只做中文化 + 排序调整
 */

type PaletteAPI = unknown
type CreateAPI = {
  start: (event: Event, shape: unknown, hints?: unknown) => void
}
type ElementFactoryAPI = {
  createShape: (opts: { type: string }) => unknown
}

/**
 * 创建 palette action 对象：
 * bpmn-js 期望 action = { dragstart, click } 两个回调，不是单函数。
 */
type PaletteAction = {
  dragstart: (event: Event) => unknown
  click: (event: Event) => unknown
}

const GROUP = {
  ACTIVITY: 'activity',
  GATEWAY: 'gateway',
  EVENT: 'event',
  DATA: 'data',
  TOOLS: 'tools',
} as const

/**
 * 创建并注册一个 palette 条目的工具函数。
 *
 * bpmn-js 期望 action 形如 { dragstart, click }，每个回调接收 event，
 * 内部调 create.start(event, shape)。如果只传函数，会触发 "Cannot read
 * properties of undefined (reading 'context')" 报错。
 */
function makeCreateAction(
  create: CreateAPI,
  elementFactory: ElementFactoryAPI,
  type: string,
): PaletteAction {
  const handler = (event: Event): unknown => {
    const shape = elementFactory.createShape({ type })
    create.start(event, shape)
    return shape
  }
  return {
    dragstart: handler,
    click: handler,
  }
}

export default class FlowablePaletteProvider {
  static $inject = ['palette', 'create', 'elementFactory']

  private palette: PaletteAPI
  private create: CreateAPI
  private elementFactory: ElementFactoryAPI

  constructor(
    palette: PaletteAPI,
    create: CreateAPI,
    elementFactory: ElementFactoryAPI,
  ) {
    this.palette = palette
    this.create = create
    this.elementFactory = elementFactory
    try {
      ;(palette as { registerProvider: (p: unknown) => void }).registerProvider(
        this,
      )
    } catch (e) {
      // bpmn-js __init__ 阶段 palette 未就绪会抛 "Cannot read properties of
      // undefined (reading 'context')"，吞掉后保留默认 palette。
      console.warn('[FlowablePalette] registerProvider failed (palette not ready), fall back to default', e)
    }
  }

  getPaletteEntries(): Record<string, unknown> {
    return {
      ...buildEventEntries(this.create, this.elementFactory),
      ...buildActivityEntries(this.create, this.elementFactory),
      ...buildGatewayEntries(this.create, this.elementFactory),
      ...buildDataEntries(this.create, this.elementFactory),
      ...buildToolEntries(this.palette),
    }
  }
}

/**
 * 导出 module config 形式给 bpmn-js DI 用：
 *   additionalModules: [FlowablePaletteModule, ...]
 * 比起直接传 class，module config 形式明确告诉 DI 在 __init__ 阶段实例化 provider。
 */
export const FlowablePaletteModule = {
  __init__: ['flowablePaletteProvider'],
  flowablePaletteProvider: ['type', FlowablePaletteProvider],
}

function buildEventEntries(
  create: CreateAPI,
  elementFactory: ElementFactoryAPI,
): Record<string, unknown> {
  return {
    'create.start-event': {
      group: GROUP.EVENT,
      className: 'bpmn-icon-start-event-none',
      title: '开始事件（流程入口）',
      action: makeCreateAction(create, elementFactory, 'bpmn:StartEvent'),
    },
    'create.intermediate-throw-event': {
      group: GROUP.EVENT,
      className: 'bpmn-icon-intermediate-event-none',
      title: '中间事件（消息 / 定时器）',
      action: makeCreateAction(create, elementFactory, 'bpmn:IntermediateThrowEvent'),
    },
    'create.end-event': {
      group: GROUP.EVENT,
      className: 'bpmn-icon-end-event-none',
      title: '结束事件（流程出口）',
      action: makeCreateAction(create, elementFactory, 'bpmn:EndEvent'),
    },
  }
}

function buildActivityEntries(
  create: CreateAPI,
  elementFactory: ElementFactoryAPI,
): Record<string, unknown> {
  return {
    'create.user-task': {
      group: GROUP.ACTIVITY,
      className: 'bpmn-icon-user-task',
      title: '用户任务（人工审批）',
      action: makeCreateAction(create, elementFactory, 'bpmn:UserTask'),
    },
    'create.service-task': {
      group: GROUP.ACTIVITY,
      className: 'bpmn-icon-service-task',
      title: '服务任务（系统自动处理 / Java 类 / 表达式 / HTTP / 邮件）',
      action: makeCreateAction(create, elementFactory, 'bpmn:ServiceTask'),
    },
    'create.script-task': {
      group: GROUP.ACTIVITY,
      className: 'bpmn-icon-script-task',
      title: '脚本任务（执行一段脚本）',
      action: makeCreateAction(create, elementFactory, 'bpmn:ScriptTask'),
    },
    'create.sub-process-expanded': {
      group: GROUP.ACTIVITY,
      className: 'bpmn-icon-sub-process-expanded',
      title: '子流程',
      action: makeCreateAction(create, elementFactory, 'bpmn:SubProcess'),
    },
  }
}

function buildGatewayEntries(
  create: CreateAPI,
  elementFactory: ElementFactoryAPI,
): Record<string, unknown> {
  return {
    'create.exclusive-gateway': {
      group: GROUP.GATEWAY,
      className: 'bpmn-icon-gateway-xor',
      title: '排他网关（条件分支）',
      action: makeCreateAction(create, elementFactory, 'bpmn:ExclusiveGateway'),
    },
    'create.parallel-gateway': {
      group: GROUP.GATEWAY,
      className: 'bpmn-icon-gateway-parallel',
      title: '并行网关（fork / join）',
      action: makeCreateAction(create, elementFactory, 'bpmn:ParallelGateway'),
    },
    'create.inclusive-gateway': {
      group: GROUP.GATEWAY,
      className: 'bpmn-icon-gateway-or',
      title: '包容网关（多条件聚合）',
      action: makeCreateAction(create, elementFactory, 'bpmn:InclusiveGateway'),
    },
  }
}

function buildDataEntries(
  create: CreateAPI,
  elementFactory: ElementFactoryAPI,
): Record<string, unknown> {
  return {
    'create.data-object': {
      group: GROUP.DATA,
      className: 'bpmn-icon-data-object',
      title: '数据对象',
      action: makeCreateAction(create, elementFactory, 'bpmn:DataObjectReference'),
    },
    'create.data-store': {
      group: GROUP.DATA,
      className: 'bpmn-icon-data-store',
      title: '数据存储',
      action: makeCreateAction(create, elementFactory, 'bpmn:DataStoreReference'),
    },
  }
}

function buildToolEntries(
  palette: PaletteAPI,
): Record<string, unknown> {
  const trigger = (event: string) => () =>
    (palette as { trigger: (e: string) => void }).trigger(event)
  return {
    'tool.lasso': {
      group: GROUP.TOOLS,
      className: 'bpmn-icon-lasso-tool',
      title: '框选工具',
      action: {
        dragstart: trigger('lasso.toggle'),
        click: trigger('lasso.toggle'),
      },
    },
    'tool.hand': {
      group: GROUP.TOOLS,
      className: 'bpmn-icon-hand-tool',
      title: '抓手工具',
      action: {
        dragstart: trigger('hand.toggle'),
        click: trigger('hand.toggle'),
      },
    },
    'tool.create-space': {
      group: GROUP.TOOLS,
      className: 'bpmn-icon-space-tool',
      title: '空间工具',
      action: {
        dragstart: trigger('space.toggle'),
        click: trigger('space.toggle'),
      },
    },
  }
}