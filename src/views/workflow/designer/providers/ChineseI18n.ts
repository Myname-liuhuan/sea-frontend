/**
 * bpmn-js / bpmn-js-properties-panel 中文翻译。
 *
 * ⚠️ diagram-js / bpmn-js 的 translate 服务其实就是一个字符串插值器，
 * 并没有翻译表 —— 所有英文文案都硬编码在每个 Provider 里
 * （比如 BpmnPaletteProvider 调 `translate('Create start event')`）。
 *
 * 翻译的实现方式：
 *   1. 在 additionalModules 里通过 DI 把 'translate' service **整个替换**
 *      成我们的版本（`['value', customTranslate]`）
 *   2. 我们的 translate 先查中文表，命中就返回中文；未命中就 fallback 到原文 + 插值
 *
 * 翻译覆盖范围：
 *   - bpmn-js PaletteProvider 的 entry 名（"Create start event" → "开始事件"）
 *   - bpmn-js-properties-panel CamundaPlatform 的 group / entry 标签
 *   - PanelPlaceholderProvider / PanelHeaderProvider 的占位文案
 *   - 部分元素类型名（"Process" → "流程"）
 */

/**
 * bpmn-js 内置英文 → 中文映射。
 *
 * Key 必须严格匹配 bpmn-js / bpmn-js-properties-panel 源码里 `translate('...')` 的参数。
 * 翻译值可以随意改（前端文案自由度高）。
 *
 * 收集来源：
 *   - bpmn-js/lib/features/palette/PaletteProvider.js
 *   - bpmn-js-properties-panel/dist/index.esm.js （CamundaPlatformPropertiesProvider 等）
 */
const ZH: Record<string, string> = {
  // —— Palette（bpmn-js PaletteProvider） ——
  'Create start event': '开始事件',
  'Create intermediate/boundary event': '中间 / 边界事件',
  'Create end event': '结束事件',
  'Create gateway': '网关',
  'Create task': '任务',
  'Create expanded sub-process': '子流程',
  'Create data object reference': '数据对象引用',
  'Create data store reference': '数据存储引用',
  'Create pool/participant': '泳道 / 参与者',
  'Create group': '分组',
  'Activate hand tool': '抓手工具（拖动画布）',
  'Activate lasso tool': '框选工具（拉框选中多个节点）',
  'Activate create/remove space tool': '空间工具（拖动调整节点间距）',
  'Activate global connect tool': '全局连线工具（拖出连线到任意节点）',

  // —— bpmn-js 通用 ——
  'Open {element}': '打开 {element}',
  'Append {element}': '在 {element} 后追加',
  'Add {element}': '添加 {element}',
  'Add Lane above': '在上方添加泳道',
  'Add Lane below': '在下方添加泳道',
  'Divide Lane': '拆分泳道',
  'Join Lane': '合并泳道',
  'Lane': '泳道',
  'Participant': '参与者',

  // —— Properties panel：通用 ——
  'General': '基础信息',
  'Details': '详情',
  'Documentation': '文档说明',
  'Select an element to edit its properties.': '选中一个元素来编辑它的属性',
  'Multiple elements are selected. Select a single element to edit its properties.':
    '已选中多个元素。请选中单个元素来编辑属性。',
  '<none>': '无',
  'empty': '空',
  'id': 'ID',
  'Id': 'ID',
  'Name': '名称',
  'Process ID': '流程 ID',
  'Process Name': '流程名称',

  // —— CamundaPlatform 扩展属性 ——
  'Implementation': '实现',
  'Candidate starter groups': '可发起角色',
  'Candidate starter groups (comma-separated)': '可发起角色（逗号分隔）',
  'Candidate starter users': '可发起用户',
  'Candidate starter users (comma-separated)': '可发起用户（逗号分隔）',
  'Candidate starter': '可发起人',
  'Version tag': '版本标签',
  'Executable': '可执行',
  'Initiator': '发起人变量',
  'Form key': '表单 Key',
  'Form fields': '表单字段',
  'Form': '表单',
  'Camunda Form': 'Camunda 表单',
  'Camunda Form (embedded)': 'Camunda 表单（嵌入式）',
  'Camunda Form (linked)': 'Camunda 表单（链接）',
  'Camunda Forms': 'Camunda 表单',
  'Forms': '表单',
  'Async before': '前置异步',
  'Async after': '后置异步',
  'Asynchronous before': '前置异步',
  'Asynchronous after': '后置异步',
  'Asynchronous continuations': '异步延续',
  'Exclusive': '排他',
  'Job priority': '任务优先级',
  'Due date': '到期时间',
  'Follow up date': '跟踪时间',
  'Priority': '优先级',
  'Assignee': '处理人',
  'Assignee (Expression)': '处理人（表达式）',
  'Candidate users': '候选人',
  'Candidate groups': '候选组',
  'Candidate users (comma-separated)': '候选人（逗号分隔）',
  'Candidate groups (comma-separated)': '候选组（逗号分隔）',
  'Condition expression': '条件表达式',
  'Multi-instance': '多实例',
  'Sequential': '顺序',
  'Loop cardinality': '循环基数',
  'Collection': '集合',
  'Active elements': '激活元素集合',
  'Active elements collection': '激活元素集合',
  'Element variable': '元素变量',
  'Completion condition': '完成条件',
  'Cancel remaining instances': '取消剩余实例',
  'Wait for completion': '等待完成',
  'Listeners': '监听器',
  'Execution listener': '执行监听器',
  'Task listener': '任务监听器',
  'Event type': '事件类型',
  'Listener type': '监听器类型',
  'Java class': 'Java 类',
  'Expression': '表达式',
  'Delegate expression': '委托表达式',
  'Script': '脚本',
  'Script format': '脚本格式',
  'Errors': '错误',
  'Error code': '错误码',
  'Escalation': '升级',
  'Escalation code': '升级码',
  'Message': '消息',
  'Message name': '消息名',
  'Signal': '信号',
  'Signal name': '信号名',
  'Timer': '定时器',
  'Timer definition type': '定时器类型',
  'Cycle': '循环',
  'Duration': '持续时间',
  'Date': '日期',
  'Variable name': '变量名',
  'Variable assignment': '变量赋值',
  'Input': '输入',
  'Output': '输出',
  'Output type': '输出类型',
  'Result variable': '结果变量',
  'Activity reference': '活动引用',
  'Called element': '被调用元素',
  'Business key': '业务 Key',
  'Business key expression': '业务 Key 表达式',
  'Case ref': '案例引用',
  'Callable binding': '可调用绑定',
  'Binding': '绑定',
  'Compensation': '补偿',
  'History cleanup': '历史清理',
  'Tasklist': '任务列表',
  'External task': '外部任务',
  'Job execution': '作业执行',
  'Execution listeners': '执行监听器',
  'Extension properties': '扩展属性',
  'Code': '编码',
  'Code variable': '编码变量',
  'Class': '类',
  'Assignment': '分配',
  'Assignment type': '分配类型',
  'After': '之后',
  'Before': '之前',
  'BPMN': 'BPMN',
  'CMMN': 'CMMN',

  // —— 元素类型名（properties panel header） ——
  'Process': '流程',
  'Start Event': '开始事件',
  'Intermediate Throw Event': '中间抛出事件',
  'End Event': '结束事件',
  'User Task': '用户任务',
  'Service Task': '服务任务',
  'Script Task': '脚本任务',
  'Send Task': '发送任务',
  'Receive Task': '接收任务',
  'Manual Task': '手动任务',
  'Business Rule Task': '业务规则任务',
  'Task': '任务',
  'Sub Process': '子流程',
  'Call Activity': '调用活动',
  'Exclusive Gateway': '排他网关',
  'Parallel Gateway': '并行网关',
  'Inclusive Gateway': '包容网关',
  'Event Based Gateway': '事件网关',
  'Complex Gateway': '复杂网关',
  'Sequence Flow': '顺序流',
  'Data Object Reference': '数据对象引用',
  'Data Store Reference': '数据存储引用',
  'Group': '分组',
  'Text Annotation': '文本注释',
}

/**
 * 自定义 translate 函数：先查中文表，命中返回中文；否则 fallback 到原文 + 插值。
 *
 * 签名必须和 diagram-js/lib/i18n/translate/translate.js 一致：
 *   translate(template: string, replacements?: Record<string, string>): string
 */
function chineseTranslate(
  template: string,
  replacements?: Record<string, string>,
): string {
  const translated = ZH[template] ?? template
  // diagram-js 的 translate 只做 {var} 替换
  return translated.replace(/{([^}]+)}/g, (_, key) => {
    return (replacements && replacements[key]) || `{${key}}`
  })
}

/**
 * DI 模块声明：用 ['value', chineseTranslate] 完全替换默认 translate service。
 *
 * 通过 additionalModules 注入到 Modeler，所有 translate('xxx') 调用都会走我们的版本。
 */
export const ChineseTranslateModule = {
  translate: ['value', chineseTranslate],
}