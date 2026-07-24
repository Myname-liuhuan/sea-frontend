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
  updateModel,
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
      // 内层 try/catch 抓 DI / 模块加载失败 —— 之前失败会被外层 finally 吞掉，
      // 导致 modeler.value 保持 null，用户点保存按钮报"设计器尚未初始化"，
      // 但根本原因（模块解析失败 / xml 解析失败）被吞掉了，看不到。
      let inst: BpmnModelerInstance
      try {
        inst = new BpmnModelerCtor({
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
      } catch (e) {
        const err = e as Error
        console.error('[useModelDesigner] Modeler 构造失败', err)
        Message.error(`设计器初始化失败：${err.message ?? '未知错误'}`)
        return
      }

      // 4. 装 XML
      // 后端返回的 EMPTY_BPMN_XML 没有 DI（Diagram Interchange）信息，
      // bpmn-js 拿到后无法定位元素位置，画布看起来是空的。
      // 检测：含 <bpmndi:BPMNDiagram 视为有 DI；否则用前端模板（带 StartEvent 坐标）
      const hasDiagram = xml.includes('bpmndi:BPMNDiagram')
      const seed = hasDiagram ? xml : EMPTY_PROCESS_XML
      try {
        await inst.importXML(seed)
      } catch (e) {
        const err = e as Error
        console.error('[useModelDesigner] importXML 失败', err)
        Message.error(`BPMN XML 解析失败：${err.message ?? '未知错误'}`)
        // XML 解析失败时仍然保留 modeler 实例（用户可手动编辑空白画布）
        // 但记一笔警告
      }

      // 5. 视图自适应
      try {
        inst.get<{ zoom: (s: string) => void }>('canvas').zoom('fit-viewport')
      } catch {
        // zoom 失败不影响使用
      }

      // 6. 装 lint 监听（可选）
      //    bpmn-js-bpmnlint 提供 'lint' service —— 如果 additionalModules 没注册它，
      //    inst.get('lint') 会抛"No provider for lint"错误。我们用 false 第二参数让
      //    didi 返回 null 而不是抛错。
      try {
        const lintInstance = (inst as unknown as { get: (n: string, strict?: boolean) => unknown }).get('lint', false) as
          | { on: (e: string, cb: (e: { warnings?: LintWarning[] } | undefined) => void) => void }
          | null
        if (lintInstance && typeof lintInstance.on === 'function') {
          lintInstance.on('linting.completed', (event) => {
            lintWarnings.value = event?.warnings ?? []
          })
        } else if (typeof (inst as unknown as { on: (e: string, cb: (e: unknown) => void) => void }).on === 'function') {
          // 兜底：从 modeler 直接监听 linting.* 事件
          inst.on('linting.completed', (event: { warnings: LintWarning[] } | undefined) => {
            lintWarnings.value = event?.warnings ?? []
          })
        }
      } catch {
        // lint 模块没注册 —— 完全可选，吞掉
      }

      // 关键：markRaw 阻止 Vue 把 inst 包成响应式 Proxy，避免破坏 bpmn-js 内部 this.* 链
      // 即便 importXML 失败，也保留 modeler 实例（用户至少能编辑空白画布），
      // 这样保存按钮不会再误报"设计器尚未初始化"。
      modeler.value = markRaw(inst)
      currentXml.value = seed
      loading.value = false  // 提前置 false，让 UI 解禁；之前 finally 设的顺序也对，但提前更明确

      // 调试用：把 modeler 挂到 window，方便用 Selection.select() 直接触发选中
      ;(window as unknown as { __bpmnModeler: unknown }).__bpmnModeler = inst
      return
    } catch (e) {
      const err = e as Error
      console.error('[useModelDesigner] initModeler 抛出未捕获异常', err, '\nStack:', err.stack)
      Message.error(`设计器初始化失败：${err.message ?? '未知错误'}`)
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
      return
    }

    // edit 模式：PUT 更新元数据。
    // 之前漏了这条分支，导致编辑现有模型时按钮"无反应"。
    if (!modelId.value) {
      Message.warning('缺少模型 ID，无法保存')
      return
    }
    const res = await updateModel(modelId.value, {
      name: metaForm.name,
      businessType: metaForm.businessType,
      description: metaForm.description,
    })
    if (res.code !== RESPONSE_CODE.SUCCESS) {
      Message.error(res.message || '保存失败')
      return
    }
    currentModel.value = res.data ?? currentModel.value
    Message.success('元数据已保存')
  }

  async function saveBpmn() {
    if (!modelId.value) {
      Message.warning('请先保存元数据')
      return
    }
    if (loading.value) {
      // 初始化未完成 —— 按钮理论上应已禁用，但兜底再防一次
      Message.warning('设计器正在初始化，请稍候')
      return
    }
    const inst = modeler.value
    if (!inst) {
      Message.error('设计器初始化失败，请刷新页面重试')
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