/**
 * bpmn-js-bpmnlint 实时校验结果的类型。
 *
 * 来源：bpmnlint warning 标准字段。
 */
export interface LintWarning {
  id: string
  message: string
  category: 'error' | 'warn' | 'info'
  rule: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  element?: any
}