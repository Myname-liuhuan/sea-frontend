/**
 * bpmn-js 生态类型 shim。
 *
 * bpmn-js / bpmn-js-properties-panel / flowable-bpmn-moddle /
 * bpmn-js-bpmnlint / diagram-js-minimap 部分包没自带 .d.ts，
 * 这里统一声明为 any，由调用方按需细化。
 */
declare module 'bpmn-js-properties-panel' {
  const exports: Record<string, unknown>
  export = exports
}

declare module 'flowable-bpmn-moddle' {
  const mod: Record<string, unknown>
  export = mod
}

declare module 'flowable-bpmn-moddle/resources/camunda.json' {
  const json: Record<string, unknown>
  export default json
}

declare module 'bpmn-js-bpmnlint' {
  const exports: Record<string, unknown>
  export = exports
}

declare module 'diagram-js-minimap' {
  const exports: Record<string, unknown>
  export = exports
}

declare module '@bpmn-io/properties-panel' {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const TextFieldEntry: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const TextAreaEntry: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const CheckboxEntry: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const SelectEntry: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ToggleSwitchEntry: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ListEntry: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Group: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const isTextFieldEntryEdited: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const isCheckboxEntryEdited: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const isSelectEntryEdited: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const isTextAreaEntryEdited: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const isToggleSwitchEntryEdited: any
  export {
    TextFieldEntry,
    TextAreaEntry,
    CheckboxEntry,
    SelectEntry,
    ToggleSwitchEntry,
    ListEntry,
    Group,
    isTextFieldEntryEdited,
    isCheckboxEntryEdited,
    isSelectEntryEdited,
    isTextAreaEntryEdited,
    isToggleSwitchEntryEdited,
  }
}

declare module 'bpmn-js/dist/assets/diagram-js.css'
declare module 'bpmn-js/dist/assets/bpmn-font/css/bpmn.css'
declare module 'bpmn-js/dist/assets/bpmn-js.css'
declare module 'bpmn-js-properties-panel/dist/assets/properties-panel.css'
declare module 'diagram-js-minimap/assets/diagram-js-minimap.css'