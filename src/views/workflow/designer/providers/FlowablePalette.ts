/**
 * Flowable 风格 Palette：
 * 1. 继承 bpmn-js 默认 BpmnPaletteProvider，覆盖其 getPaletteEntries()，
 *    把每个图标配上中文短标签，丢掉默认的英文 tooltip-only 风格。
 * 2. 通过 DI 用同名 token `paletteProvider` 替换默认实现，避免双 provider 重复条目。
 * 3. 用 bpmn-js 的 `html` 字段在 entry 内联图标 + 文字；保留 `title` 作详细 hover 提示。
 * 4. 用 `separator: true` 在分组之间插入细分隔线。
 *
 * 为什么用继承而不是注册新 provider：
 *   - bpmn-js 默认 BpmnPaletteProvider 在 __init__ 阶段就 registerProvider 了自己，
 *     我们再 registerProvider 一份的话会出现双份条目（图标+默认 vs 图标+中文）。
 *   - 通过 DI 用同名 token 替换（palette: ['type', BpmnPaletteProvider, ...]）是 bpmn-js
 *     官方支持的模块覆盖方式（见 bpmn-js/lib/Modeler.js 顶部注释）。
 */

import BpmnPaletteProvider from 'bpmn-js/lib/features/palette/PaletteProvider'
import type {
  PaletteEntries,
  PaletteEntry,
} from 'diagram-js/lib/features/palette/PaletteProvider'

/**
 * 把图标 + 中文短标签包成单个根元素。
 *
 * ⚠️ 必须单根元素！min-dom 的 domify 在多同级元素时返回 DocumentFragment，
 * bpmn-js 后续对 fragment 调 setAttribute 会抛 "is not a function"。
 */
function buildEntryHtml(iconClass: string, label: string): string {
  const safeLabel = label.replace(/[<>&]/g, (c) =>
    c === '<' ? '&lt;' : c === '>' ? '&gt;' : '&amp;',
  )
  return `<span class="palette-entry-inner"><span class="palette-entry-icon ${iconClass}"></span><span class="palette-entry-label">${safeLabel}</span></span>`
}

/**
 * 用 entry.html + entry.title 覆盖原 entry 的渲染。其它字段（group / action）保持原样。
 */
function localize(entry: PaletteEntry, label: string, detailedTitle: string): PaletteEntry {
  const iconClass =
    typeof entry.className === 'string'
      ? entry.className.split(/\s+/).filter((c) => c.startsWith('bpmn-icon-'))[0] ?? ''
      : ''
  return {
    ...entry,
    className: 'palette-entry',
    html: iconClass ? buildEntryHtml(iconClass, label) : entry.html,
    title: detailedTitle,
  }
}

/**
 * 替换默认 BpmnPaletteProvider：调用父类拿到默认 entries，再遍历加上中文标签。
 */
export default class FlowablePaletteProvider extends BpmnPaletteProvider {
  // 继承父类的 $inject，TypeScript 不识别所以保留父类声明
  declare $inject: string[]

  /**
   * 必须保持和父类相同的 $inject 数组，否则 DI 拿不到依赖。
   * 这里直接复用父类静态字段。
   */
  static $inject = (BpmnPaletteProvider as unknown as { $inject: string[] }).$inject

  getPaletteEntries(): PaletteEntries {
    // 调用父类拿到默认 entries（hand-tool / lasso-tool / start-event / task / ...）
    const entries = super.getPaletteEntries() as PaletteEntries

    // 翻译映射：entry id → (中文短标签, 详细 hover 提示)
    const LABELS: Record<string, readonly [string, string]> = {
      'hand-tool': ['抓手', '抓手工具（拖动画布）'],
      'lasso-tool': ['框选', '框选工具（拉框选中多个节点）'],
      'space-tool': ['空间', '空间工具（拖动创建 / 调整节点间距）'],
      'global-connect-tool': ['连线', '全局连线工具（拖出连线到任意节点）'],
      'create.start-event': ['开始', '开始事件（流程入口）'],
      'create.intermediate-event': ['中间', '中间事件（消息 / 定时器）'],
      'create.end-event': ['结束', '结束事件（流程出口）'],
      'create.exclusive-gateway': ['排他', '排他网关（条件分支）'],
      'create.task': ['任务', '普通任务（抽象节点）'],
      'create.data-object': ['数据', '数据对象'],
      'create.data-store': ['存储', '数据存储'],
      'create.subprocess-expanded': ['子流程', '子流程（带开始事件的复合节点）'],
      'create.participant-expanded': ['泳道', '泳道 / 参与者（多流程协作）'],
      'create.group': ['分组', '分组（视觉分组，无业务语义）'],
    }

    const result: PaletteEntries = {}
    for (const [id, entry] of Object.entries(entries)) {
      const localized = LABELS[id]
      result[id] = localized ? localize(entry, localized[0], localized[1]) : entry
    }

    // 在分组之间补细分隔线（separator: true 渲染为 <hr class="separator" />）
    // PaletteEntry 类型要求 action 字段，但 separator 不需要 action —— 用 satisfies
    // 让类型更精确地表达"可选 action"
    return {
      ...result,
      __separator_after_event: { separator: true } as PaletteEntry,
      __separator_after_gateway: { separator: true } as PaletteEntry,
      __separator_after_activity: { separator: true } as PaletteEntry,
      __separator_after_data: { separator: true } as PaletteEntry,
    }
  }
}

/**
 * module config：通过 DI 用同名 token `paletteProvider` 覆盖默认实现，
 * bpmn-js 内部会用我们的 FlowablePaletteProvider 替换默认 PaletteProvider，
 * 这样不会双注册。
 */
export const FlowablePaletteModule = {
  paletteProvider: ['type', FlowablePaletteProvider],
}