/**
 * bpmn-js 生态类型 shim。
 *
 * bpmn-js / bpmn-js-properties-panel / camunda-bpmn-moddle 部分包没自带 .d.ts，
 * 这里统一声明为 any，由调用方按需细化。
 */
declare module 'bpmn-js-properties-panel' {
  const exports: Record<string, unknown>
  export = exports
}

declare module 'camunda-bpmn-moddle' {
  const mod: Record<string, unknown>
  export = mod
}

declare module 'camunda-bpmn-moddle/resources/camunda.json' {
  const json: Record<string, unknown>
  export default json
}

declare module 'bpmn-js/dist/assets/diagram-js.css'
declare module 'bpmn-js/dist/assets/bpmn-font/css/bpmn.css'
declare module 'bpmn-js/dist/assets/bpmn-js.css'
declare module 'bpmn-js-properties-panel/dist/assets/properties-panel.css'