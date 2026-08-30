<script setup lang="ts">
import { computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { Steps as ASteps } from '@arco-design/web-vue'
import { useWorkflowDetail } from '@/hooks/useWorkflowDetail'
import { WORKFLOW_STATUS_LABEL } from '@/types/workflow'

const route = useRoute()
const { loading, detail, fetchDetail } = useWorkflowDetail()

const taskNo = computed(() =>
  Array.isArray(route.query.taskNo) ? route.query.taskNo[0] : route.query.taskNo,
)

watch(
  taskNo,
  (v) => {
    if (v) fetchDetail(v as string)
  },
  { immediate: true },
)

const statusText = computed(() =>
  detail.value ? WORKFLOW_STATUS_LABEL[detail.value.task.status] || '-' : '-',
)
</script>

<template>
  <div class="workflow-detail-page">
    <div v-if="loading" class="loading">加载中…</div>
    <template v-else-if="detail">
      <header class="page-header">
        <h2>工单 {{ detail.task.taskNo }}</h2>
        <span class="status-tag">{{ statusText }}</span>
      </header>

      <section class="card">
        <h3>基本信息</h3>
        <ul class="meta-list">
          <li><span class="meta-key">申请人</span><span>{{ detail.task.applicantName || detail.task.applicantId }}</span></li>
          <li><span class="meta-key">目标用户</span><span>{{ detail.task.targetUserName || detail.task.targetUserId }}</span></li>
          <li><span class="meta-key">紧急程度</span><span>{{ detail.task.urgency === 2 ? '紧急' : '普通' }}</span></li>
          <li><span class="meta-key">当前节点</span><span>{{ detail.task.currentNode || '-' }}</span></li>
          <li><span class="meta-key">提交时间</span><span>{{ detail.task.createTime }}</span></li>
          <li class="full"><span class="meta-key">申请原因</span><span>{{ detail.task.reason }}</span></li>
        </ul>
      </section>

      <section class="card">
        <h3>审批链路</h3>
        <!-- 刚提交还没人审批时 approvals 是空数组，v-for 不会渲染任何 step，给个兜底文案避免整块空白 -->
        <a-steps
          v-if="detail.approvals.length"
          direction="vertical"
          :current="detail.approvals.length"
        >
          <a-step
            v-for="(node, idx) in detail.approvals"
            :key="node.id"
            :title="`第 ${idx + 1} 级 · ${node.approved === 1 ? '通过' : node.approved === 0 ? '拒绝' : '已转交'}`"
            :description="`${node.approverName || node.approverId} · ${node.createTime} ${
              node.delegatedFrom ? '（被转自 userId=' + node.delegatedFrom + '）' : ''
            } ${node.comment ? '\n' + node.comment : ''}`"
          />
        </a-steps>
        <div v-else class="empty">暂无审批记录</div>
      </section>
    </template>
    <div v-else class="empty">未找到工单</div>
  </div>
</template>

<style scoped>
.page-header {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  margin-bottom: var(--space-md);
}
.card {
  background: var(--color-bg-card, #fff);
  border-radius: var(--radius-md);
  padding: var(--space-md);
  margin-bottom: var(--space-md);
  box-shadow: var(--shadow-card);
}
.meta-list {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-md) var(--space-lg);
  list-style: none;
  padding: 0;
}
.meta-list li {
  display: flex;
  gap: var(--space-sm);
}
.meta-list li.full {
  grid-column: 1 / span 2;
}
.meta-key {
  width: 80px;
  color: var(--color-text-2);
  flex-shrink: 0;
}
.loading,
.empty {
  padding: var(--space-lg);
  text-align: center;
  color: var(--color-text-2);
}
</style>
