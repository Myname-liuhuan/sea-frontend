import { markRaw, onBeforeUnmount, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Message } from '@arco-design/web-vue'
import {
  createModel,
  deployModel,
  getModel,
  getModelBpmn,
  saveModelBpmn,
} from '@/api/workflow/model'
import { RESPONSE_CODE } from '@/constants'
import type { WorkflowModel } from '@/types/workflow'

/**
 * 设计器页状态：装载 bpmn-js / 保存元数据 / 保存 BPMN / 部署 / 销毁。
 *
 * 关键约束：
 * 1. modeler 实例必须用 markRaw 包，否则 Vue 响应式代理会破坏 bpmn-js 内部 this.* 链
 * 2. destroy() 必须在 onBeforeUnmount 调一次，否则 DOM listener 泄漏
 */

/** bpmn-js 完整类型由官方 .d.ts 提供，但 properties-panel 缺类型；这里只暴露我们用到的最小子集。 */
interface BpmnModelerInstance {
  importXML(xml: string): Promise<unknown>
  saveXML(options?: { format?: boolean }): Promise<{ xml?: string }>
  saveSVG(): Promise<{ svg?: string }>
  get<T>(name: string): T
  destroy(): void
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

  const metaForm = reactive({
    name: '',
    key: '',
    businessType: '',
    description: '',
  })

  async function initModeler(container: HTMLElement, panel: HTMLElement) {
    loading.value = true
    try {
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

      const BpmnModelerMod = await import('bpmn-js/lib/Modeler')
      const propsPanelMod = await import('bpmn-js-properties-panel')
      const camundaJsonMod = await import('camunda-bpmn-moddle/resources/camunda.json')
      // bpmn-js / bpmn-js-properties-panel 部分类型对动态 import 不友好，这里用 any 兜底
      const BpmnModelerCtor = BpmnModelerMod.default as unknown as new (opts: unknown) => BpmnModelerInstance
      const propsPanelAny = propsPanelMod as unknown as Record<string, unknown>
      const camundaJson = camundaJsonMod.default as unknown as Record<string, unknown>

      const inst = new BpmnModelerCtor({
        container,
        propertiesPanel: { parent: panel },
        additionalModules: [
          propsPanelAny.BpmnPropertiesPanelModule,
          propsPanelAny.BpmnPropertiesProviderModule,
          propsPanelAny.CamundaPlatformPropertiesProviderModule,
        ],
        moddleExtensions: { camunda: camundaJson },
      })

      await inst.importXML(xml)
      inst.get<{ zoom: (s: string) => void }>('canvas').zoom('fit-viewport')
      // 关键：markRaw 阻止 Vue 把 inst 包成响应式 Proxy，避免破坏 bpmn-js 内部 this.* 链
      modeler.value = markRaw(inst)
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
      let svg: string | undefined
      try {
        const r = await inst.saveSVG()
        svg = r.svg
      } catch {
        // SVG 失败不影响保存
      }
      const res = await saveModelBpmn(modelId.value, svg ? { xml, svg } : { xml })
      if (res.code === RESPONSE_CODE.SUCCESS) {
        Message.success('已保存')
      } else {
        Message.error(res.message || '保存失败')
      }
    } finally {
      saving.value = false
    }
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
    initModeler,
    saveMeta,
    saveBpmn,
    deploy,
    destroy,
  }
}