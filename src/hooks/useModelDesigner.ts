import { markRaw, onBeforeUnmount, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Message } from '@arco-design/web-vue'
import {
  createModel,
  deployModel,
  getModel,
  getModelBpmn,
  getModelVersionBpmn,
  saveModelBpmn,
} from '@/api/workflow/model'
import { RESPONSE_CODE } from '@/constants'
import { EMPTY_PROCESS_XML } from '@/views/workflow/designer/templates/emptyProcess'
import { regenerateAllIds } from '@/views/workflow/designer/providers/CustomIdGenerator'
import { ChineseTranslateModule } from '@/views/workflow/designer/providers/ChineseI18n'
import type { WorkflowModel } from '@/types/workflow'
import type { LintWarning } from '@/types/workflow-lint'

/**
 * 设计器页状态：装载 bpmn-js / 保存元数据 / 保存 BPMN / 部署 / 销毁。
 *
 * 关键约束：
 * 1. modeler 实例必须用 markRaw 包，否则 Vue 响应式代理会破坏 bpmn-js 内部 this.* 链
 * 2. destroy() 必须在 onBeforeUnmount 调一次，否则 DOM listener 泄漏
 * 3. bpmn-js-bpmnlint 依赖 linter 包，import 时同样要按需异步加载
 *
 * 模块组合（全部用 bpmn-io 社区包）：
 * - BpmnModeler：核心画布
 * - BpmnPropertiesPanelModule + BpmnPropertiesProviderModule：id / name / 通用属性
 * - CamundaPlatformPropertiesProviderModule：assignee / candidateGroups / formKey /
 *   async / 多实例 / 监听器 / 错误边界 / 定时器 / 表达式 等 Flowable / Camunda
 *   通用扩展（这些场景官方实现的覆盖度比我们手撸的完整得多 —— 我们之前
 *   只支持 5 种元素类型，社区版支持全部 BPMN + Camunda 扩展）
 * - Minimap：缩略图
 * - BpmnLint：实时校验
 * - CustomIdGenerator：Sea 特有的"批量重置 ID"功能，社区包没有
 */

// 极简的 modeler 类型子集
interface BpmnModelerInstance {
  importXML(xml: string): Promise<{ warnings?: unknown[] }>
  saveXML(options?: { format?: boolean }): Promise<{ xml?: string }>
  saveSVG(): Promise<{ svg?: string }>
  get<T>(name: string): T
  destroy(): void
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  on(event: string, callback: (...args: any[]) => void): void
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  off(event: string, callback: (...args: any[]) => void): void
}

export function useModelDesigner() {
  const route = useRoute()
  const router = useRouter()

  const mode = ref<'new' | 'edit'>(
    route.query.mode === 'new' ? 'new' : 'edit',
  )
  const modelId = ref<string | null>(
    typeof route.query.id === 'string' ? route.query.id : null,
  )

  const loading = ref(false)
  const saving = ref(false)
  const deploying = ref(false)
  const currentModel = ref<WorkflowModel | null>(null)
  const modeler = ref<BpmnModelerInstance | null>(null)

  /** 实时 lint 报告，供 LinterPanel 渲染 */
  const lintWarnings = ref<LintWarning[]>([])

  /** 当前 BPMN XML（用于 diff / 回滚） */
  const currentXml = ref<string>('')

  const metaForm = reactive({
    name: '',
    key: '',
    businessType: '',
    description: '',
  })

  /**
   * 初始化 modeler。
   *
   * @param canvas  画布容器 ref
   * @param panel   属性面板容器 ref（bpmn-js-properties-panel 挂载点）
   */
  async function initModeler(
    canvas: HTMLElement,
    panel: HTMLElement,
  ): Promise<void> {
    loading.value = true
    try {
      // 1. 取模型 XML
      let xml = ''
      if (mode.value === 'edit' && modelId.value) {
        const resp = await getModel(modelId.value)
        if (resp.code !== RESPONSE_CODE.SUCCESS || !resp.data) {
          Message.error(resp.message || '获取模型失败')
          return
        }
        currentModel.value = resp.data
        metaForm.name = resp.data.name
        metaForm.key = resp.data.key
        metaForm.businessType = resp.data.businessType ?? ''
        metaForm.description = resp.data.description ?? ''

        const bpmnResp = await getModelBpmn(modelId.value)
        if (bpmnResp.code === RESPONSE_CODE.SUCCESS && bpmnResp.data) {
          xml = bpmnResp.data
        }
      } else {
        currentModel.value = null
        metaForm.name = ''
        metaForm.key = ''
        metaForm.businessType = ''
        metaForm.description = ''
      }

      // 2. 动态加载 bpmn-js 相关模块
      const BpmnModelerMod = await import('bpmn-js/lib/Modeler')
      const flowableJsonMod = await import(
        'flowable-bpmn-moddle/resources/camunda.json'
      )
      const minimapMod = await import('diagram-js-minimap')
      // bpmn-js-properties-panel 官方三件套：面板渲染 + BPMN 通用属性 + Camunda/Flowable 扩展
      const propsPanelMod = await import('bpmn-js-properties-panel')

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const BpmnModelerCtor = (BpmnModelerMod as any).default as new (opts: unknown) => BpmnModelerInstance
      const flowableJson = (flowableJsonMod as { default: unknown }).default as Record<string, unknown>
      const minimap = minimapMod as Record<string, unknown>

      // 3. 构造 Modeler
      const inst = new BpmnModelerCtor({
        container: canvas,
        // 让社区属性面板直接挂到 Vue 提供的容器里：
        propertiesPanel: { parent: panel },
        additionalModules: [
          // bpmn-js-properties-panel 三件套 —— 完整覆盖 BPMN + Camunda/Flowable 扩展
          // （id / name / assignee / candidateGroups / formKey / async / 多实例 / 监听器 / 定时器 / ...）
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (propsPanelMod as any).BpmnPropertiesPanelModule,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (propsPanelMod as any).BpmnPropertiesProviderModule,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (propsPanelMod as any).CamundaPlatformPropertiesProviderModule,
          // 用我们的 translate 替换默认（把 palette / properties panel 文案翻成中文）
          ChineseTranslateModule,
          minimap.default,
        ],
        moddleExtensions: { flowable: flowableJson },
      })

      // 4. 装 XML
      // 后端返回的 EMPTY_BPMN_XML 没有 DI（Diagram Interchange）信息，
      // bpmn-js 拿到后无法定位元素位置，画布看起来是空的。
      // 检测：含 <bpmndi:BPMNDiagram 视为有 DI；否则用前端模板（带 StartEvent 坐标）
      const hasDiagram = xml.includes('bpmndi:BPMNDiagram')
      const seed = hasDiagram ? xml : EMPTY_PROCESS_XML
      await inst.importXML(seed)
      // 5. 视图自适应
      inst.get<{ zoom: (s: string) => void }>('canvas').zoom('fit-viewport')

      // 6. 装 lint 监听：bpmn-js-bpmnlint 把校验结果写入 elementRegistry / overlays；
      //    通过 lint 事件拿到 warnings
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const lintInstance = inst.get<any>('lint')
      if (lintInstance && typeof lintInstance.on === 'function') {
        lintInstance.on('linting.completed', (event: { warnings: LintWarning[] } | undefined) => {
          lintWarnings.value = event?.warnings ?? []
        })
      } else if (typeof (inst as unknown as { on: (e: string, cb: (e: unknown) => void) => void }).on === 'function') {
        // 兜底：从 modeler 直接监听 linting.* 事件
        inst.on('linting.completed', (event: { warnings: LintWarning[] } | undefined) => {
          lintWarnings.value = event?.warnings ?? []
        })
      }

      // 关键：markRaw 阻止 Vue 把 inst 包成响应式 Proxy，避免破坏 bpmn-js 内部 this.* 链
      modeler.value = markRaw(inst)
      currentXml.value = seed

      // 调试用：把 modeler 挂到 window，方便用 Selection.select() 直接触发选中
      ;(window as unknown as { __bpmnModeler: unknown }).__bpmnModeler = inst
    } finally {
      loading.value = false
    }
  }

  async function saveMeta() {
    if (!metaForm.name || !metaForm.key || !metaForm.businessType) {
      Message.warning('请填写名称 / Key / 业务类型')
      return
    }
    if (mode.value === 'new') {
      const res = await createModel({
        name: metaForm.name,
        key: metaForm.key,
        businessType: metaForm.businessType,
        description: metaForm.description,
      })
      if (res.code !== RESPONSE_CODE.SUCCESS || !res.data) {
        Message.error(res.message || '新建失败')
        return
      }
      currentModel.value = res.data
      modelId.value = res.data.id
      mode.value = 'edit'
      await router.replace({
        path: '/workflow/designer',
        query: { id: res.data.id, mode: 'edit' },
      })
      Message.success('已创建，开始编辑流程')
    }
  }

  async function saveBpmn() {
    if (!modelId.value) {
      Message.warning('请先保存元数据')
      return
    }
    const inst = modeler.value
    if (!inst) {
      Message.warning('设计器尚未初始化')
      return
    }
    saving.value = true
    try {
      const { xml } = await inst.saveXML({ format: true })
      if (!xml) {
        Message.error('XML 序列化失败')
        return
      }
      currentXml.value = xml
      let svg: string | undefined
      try {
        const r = await inst.saveSVG()
        svg = r.svg
      } catch {
        // SVG 失败不影响保存
      }
      const res = await saveModelBpmn(modelId.value, svg ? { xml, svg } : { xml })
      if (res.code === RESPONSE_CODE.SUCCESS) {
        Message.success('已保存（已写入历史版本）')
      } else {
        Message.error(res.message || '保存失败')
      }
    } finally {
      saving.value = false
    }
  }

  /**
   * 一键重置所有节点 ID（按类型前缀 + 顺序号）。
   */
  function regenerateIds(): void {
    const inst = modeler.value as unknown as { get: (n: string) => unknown } | null
    if (!inst) {
      Message.warning('设计器尚未初始化')
      return
    }
    regenerateAllIds(inst)
    Message.success('已批量重置节点 ID')
  }

  /**
   * 用历史版本的 BPMN 替换当前画布。
   * 由 VersionsPanel 的 rollback 后回调触发，自动 reload XML。
   */
  async function applyHistoryXml(version: number): Promise<void> {
    if (!modelId.value) return
    const res = await getModelVersionBpmn(modelId.value, version)
    if (res.code !== RESPONSE_CODE.SUCCESS || !res.data) {
      Message.error(res.message || '取历史版本失败')
      return
    }
    const inst = modeler.value
    if (!inst) return
    await inst.importXML(res.data)
    currentXml.value = res.data
    Message.success(`已应用 v${version}`)
  }

  async function deploy() {
    if (!modelId.value) {
      Message.warning('请先保存')
      return
    }
    deploying.value = true
    try {
      const res = await deployModel(modelId.value)
      if (res.code === RESPONSE_CODE.SUCCESS && res.data) {
        Message.success(`部署成功（v${res.data.version}）`)
      } else {
        Message.error(res.message || '部署失败')
      }
    } finally {
      deploying.value = false
    }
  }

  function destroy() {
    const inst = modeler.value
    if (inst) {
      try {
        inst.destroy()
      } catch {
        // bpmn-js destroy 在部分边缘情况会抛错，吞掉不影响后续
      }
      modeler.value = null
      lintWarnings.value = []
    }
  }

  onBeforeUnmount(destroy)

  return {
    metaForm,
    loading,
    saving,
    deploying,
    currentModel,
    modelId,
    mode,
    modeler,
    lintWarnings,
    currentXml,
    initModeler,
    saveMeta,
    saveBpmn,
    deploy,
    regenerateIds,
    applyHistoryXml,
    destroy,
  }
}