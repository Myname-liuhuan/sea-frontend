<script setup lang="ts">
/**
 * Flowable Property Panel：自写的 Vue 属性面板，替代 bpmn-js-properties-panel。
 *
 * 监听 modeler 的 selection.changed 事件，按元素类型渲染不同字段组。
 * 每个字段 v-model 双向绑到 formState，watcher 把变更通过 commandStack
 * 写入 bpmn-js 模型。
 *
 * 字段集与原来的 FlowablePropertiesProvider 一致：
 * - Process: candidateStarterGroups / candidateStarterUsers / versionTag
 * - StartEvent: initiator / formKey
 * - UserTask: assignee / candidateUsers / candidateGroups / dueDate / priority / formKey / async
 * - ServiceTask: type / async
 * - SequenceFlow: conditionExpression
 */

import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import {
  Form as AForm,
  FormItem as AFormItem,
  Input as AInput,
  InputNumber as AInputNumber,
  Checkbox as ACheckbox,
  Select as ASelect,
  Option as ASelectOption,
  Empty as AEmpty,
} from '@arco-design/web-vue'

type BpmnElement = {
  id?: string
  type?: string
  businessObject?: Record<string, unknown> & { $modeler?: unknown }
  $modeler?: { get: (n: string) => unknown }
}

const props = defineProps<{ modeler: { get: (n: string) => unknown } | null }>()

/** 当前选中的元素（modeler 推过来） */
const currentElement = ref<BpmnElement | null>(null)

/** 表单状态：key = 字段名，value = 当前值 */
const formState = reactive<Record<string, string | number | boolean | undefined>>({})

/** 元素类型展示 */
const elementLabel = computed(() => {
  const el = currentElement.value
  if (!el) return '未选中元素'
  const map: Record<string, string> = {
    'bpmn:Process': '流程',
    'bpmn:StartEvent': '开始事件',
    'bpmn:EndEvent': '结束事件',
    'bpmn:UserTask': '用户任务',
    'bpmn:ServiceTask': '服务任务',
    'bpmn:SequenceFlow': '连线',
  }
  return map[el.type ?? ''] ?? el.type ?? '元素'
})

const isProcess = computed(() => currentElement.value?.type === 'bpmn:Process')
const isStartEvent = computed(() => currentElement.value?.type === 'bpmn:StartEvent')
const isUserTask = computed(() => currentElement.value?.type === 'bpmn:UserTask')
const isServiceTask = computed(() => currentElement.value?.type === 'bpmn:ServiceTask')
const isSequenceFlow = computed(() => currentElement.value?.type === 'bpmn:SequenceFlow')

/** 取 modeler 的 commandStack / moddle */
function getServices(el: BpmnElement | null) {
  if (!el) return { commandStack: null, moddle: null }
  const modeler = (el.$modeler ?? (el.businessObject?.$modeler as BpmnElement['$modeler'])) as BpmnElement['$modeler'] | undefined
  // modeler 可能是 element 自己
  const m = modeler ?? (props.modeler as unknown as BpmnElement['$modeler'])
  return {
    commandStack: (m?.get?.('commandStack') as { execute: (cmd: string, ctx: unknown) => void } | undefined),
    moddle: (m?.get?.('moddle') as { create: (type: string, props?: Record<string, unknown>) => unknown } | undefined),
  }
}

/** 把 bo 字段刷到 formState（每次选中元素都调） */
function reloadFormState(el: BpmnElement | null): void {
  Object.keys(formState).forEach((k) => delete formState[k])
  if (!el) return
  const bo = (el.businessObject ?? el) as Record<string, unknown>
  for (const k of Object.keys(bo)) {
    const v = bo[k]
    if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
      formState[k] = v
    } else {
      formState[k] = undefined
    }
  }
}

/** 单个字段提交：走 commandStack */
function updateField(field: string, value: unknown): void {
  const el = currentElement.value
  if (!el) return
  const { commandStack, moddle } = getServices(el)
  if (!commandStack || !moddle) return
  let properties: Record<string, unknown>
  if (field === 'conditionExpression') {
    properties = value
      ? {
          conditionExpression: moddle.create('bpmn:FormalExpression', {
            body: value,
          }),
        }
      : { conditionExpression: undefined }
  } else {
    properties = { [field]: value || undefined }
  }
  commandStack.execute('element.update-moddle-properties', {
    element: el,
    moddle,
    properties,
  })
}

/** 对每个字段做 watch：值变 → updateField */
function setupFieldWatchers(): void {
  // 简单做法：watch formState 的所有键
  watch(
    () => ({ ...formState }),
    (newVal) => {
      for (const [k, v] of Object.entries(newVal)) {
        // 不重复触发（用 ref 标记当前保存的 key）
        if (k === '__initializing__') continue
        updateField(k, v)
      }
    },
    { deep: true },
  )
}

/** conditionExpression 在 bo 是 moddle 对象，需特殊处理 */
const conditionExpressionText = computed({
  get() {
    const expr = (currentElement.value?.businessObject as { conditionExpression?: { body?: string } | string } | undefined)?.conditionExpression
    if (typeof expr === 'string') return expr
    return expr?.body ?? ''
  },
  set(v: string) {
    formState.conditionExpression = v
  },
})

/** 订阅 modeler selection.changed */
let detach: (() => void) | null = null

function attach(): void {
  if (!props.modeler) return
  const eventBus = props.modeler.get('eventBus') as
    | { on: (e: string, fn: (e: { newSelection: BpmnElement[] }) => void) => void; off: (e: string, fn: (e: unknown) => void) => void }
    | undefined
  if (!eventBus) return

  const onSel = (e: { newSelection: BpmnElement[] }) => {
    const sel = e.newSelection?.[0] ?? null
    // eslint-disable-next-line no-console
    console.log('[FlowablePanel] selection.changed', { hasSel: !!sel, type: sel?.type, id: sel?.id })
    currentElement.value = sel
    reloadFormState(sel)
  }
  // eventBus.on 签名是 (event: string, priority: number, callback?)，
  // 我们的实现简化为 on(event, fn)
  ;(eventBus.on as (e: string, fn: (e: unknown) => void) => void)(
    'selection.changed',
    onSel as (e: unknown) => void,
  )
  detach = () =>
    (eventBus.off as (e: string, fn: (e: unknown) => void) => void)(
      'selection.changed',
      onSel as (e: unknown) => void,
    )

  // 初始也要触发一次（如果已有选中）
  const selection = props.modeler.get('selection') as { get: () => BpmnElement[] } | undefined
  if (selection) {
    const initial = selection.get()?.[0] ?? null
    currentElement.value = initial
    reloadFormState(initial)
  }
}

onMounted(() => {
  attach()
  setupFieldWatchers()
})

onBeforeUnmount(() => {
  detach?.()
  detach = null
})
</script>

<template>
  <div class="flowable-property-panel">
    <div v-if="!currentElement" class="empty-state">
      <a-empty description="未选中元素" />
    </div>
    <template v-else>
      <div class="panel-header">
        <div class="type">{{ elementLabel }}</div>
        <div class="id">{{ currentElement.id }}</div>
      </div>

      <a-form :model="(formState as never)" label-align="left" class="panel-form">
        <!-- Process 节点 -->
        <template v-if="isProcess">
          <a-form-item label="可发起角色">
            <a-input
              v-model="(formState.candidateStarterGroups as string)"
              placeholder="逗号分隔，如 hr,manager"
            />
          </a-form-item>
          <a-form-item label="可发起用户">
            <a-input
              v-model="(formState.candidateStarterUsers as string)"
              placeholder="逗号分隔，如 admin,hr_specialist"
            />
          </a-form-item>
          <a-form-item label="版本标签">
            <a-input v-model="(formState.versionTag as string)" />
          </a-form-item>
        </template>

        <!-- StartEvent 节点 -->
        <template v-if="isStartEvent">
          <a-form-item label="发起人变量">
            <a-input
              v-model="(formState.initiator as string)"
              placeholder="保存到该变量名"
            />
          </a-form-item>
          <a-form-item label="表单 Key">
            <a-input
              v-model="(formState.formKey as string)"
              placeholder="外部表单资源 key"
            />
          </a-form-item>
        </template>

        <!-- UserTask 节点 -->
        <template v-if="isUserTask">
          <a-form-item label="审批人">
            <a-input
              v-model="(formState.assignee as string)"
              placeholder="${initiator} 或 userId"
            />
          </a-form-item>
          <a-form-item label="候选人">
            <a-input
              v-model="(formState.candidateUsers as string)"
              placeholder="逗号分隔"
            />
          </a-form-item>
          <a-form-item label="候选组">
            <a-input
              v-model="(formState.candidateGroups as string)"
              placeholder="逗号分隔，如 hr,manager"
            />
          </a-form-item>
          <a-form-item label="到期时间">
            <a-input
              v-model="(formState.dueDate as string)"
              placeholder="ISO 或 P3D"
            />
          </a-form-item>
          <a-form-item label="优先级">
            <a-input-number
              :model-value="(formState.priority as number | undefined)"
              @update:model-value="(v: number | undefined) => (formState.priority = v)"
              :min="0"
              :max="100"
            />
          </a-form-item>
          <a-form-item label="表单 Key">
            <a-input
              v-model="(formState.formKey as string)"
              placeholder="外部表单资源 key"
            />
          </a-form-item>
          <a-form-item label="异步执行">
            <a-checkbox
              :model-value="(formState['flowable:async'] as boolean | undefined)"
              @update:model-value="(v: unknown) => (formState['flowable:async'] = Boolean(v))"
            >
              开启
            </a-checkbox>
          </a-form-item>
        </template>

        <!-- ServiceTask 节点 -->
        <template v-if="isServiceTask">
          <a-form-item label="类型">
            <a-select v-model="formState['flowable:type']">
              <a-select-option value="">自定义 JavaDelegate</a-select-option>
              <a-select-option value="mail">邮件</a-select-option>
              <a-select-option value="http">HTTP</a-select-option>
              <a-select-option value="shell">Shell 脚本</a-select-option>
              <a-select-option value="dmn">DMN 决策</a-select-option>
              <a-select-option value="camel">Camel 路由</a-select-option>
              <a-select-option value="mule">Mule ESB</a-select-option>
            </a-select>
          </a-form-item>
          <a-form-item label="异步执行">
            <a-checkbox
              :model-value="(formState['flowable:async'] as boolean | undefined)"
              @update:model-value="(v: unknown) => (formState['flowable:async'] = Boolean(v))"
            >
              开启
            </a-checkbox>
          </a-form-item>
        </template>

        <!-- SequenceFlow 节点 -->
        <template v-if="isSequenceFlow">
          <a-form-item label="条件表达式">
            <a-input
              v-model="conditionExpressionText"
              placeholder="${amount > 1000}"
            />
          </a-form-item>
        </template>

        <div v-if="!isProcess && !isStartEvent && !isUserTask && !isServiceTask && !isSequenceFlow" class="default-note">
          该元素暂无 Flowable 专属属性。可在 bpmn-js 通用属性面板编辑。
        </div>
      </a-form>
    </template>
  </div>
</template>

<style scoped lang="scss">
.flowable-property-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--bg-secondary);
  overflow-y: auto;
  font-size: 13px;
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--text-tertiary);
}

.panel-header {
  padding: var(--space-md);
  border-bottom: 1px solid var(--border-light);
  background: var(--bg-primary);
}

.type {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
}

.id {
  font-size: 11px;
  color: var(--text-tertiary);
  font-family: var(--font-mono);
  margin-top: 2px;
}

.panel-form {
  padding: var(--space-md);
}

.default-note {
  padding: var(--space-md);
  color: var(--text-tertiary);
  font-size: 12px;
  line-height: 1.6;
  background: var(--bg-primary);
  border-radius: var(--radius-md);
  border: 1px dashed var(--border-light);
}
</style>