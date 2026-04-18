<script setup lang="ts">
import { ref, onMounted } from 'vue'

// 模拟统计数据
const stats = ref([
  { label: '总用户数', value: '1,280', change: '+12%', trend: 'up' },
  { label: '今日活跃', value: '580', change: '+8%', trend: 'up' },
  { label: '新增用户', value: '48', change: '+5%', trend: 'up' },
  { label: '系统消息', value: '12', change: '-3%', trend: 'down' },
])

const activities = ref([
  { time: '10:32', user: '张三', action: '登录系统', status: 'success' },
  { time: '10:28', user: '李四', action: '修改了用户信息', status: 'success' },
  { time: '10:15', user: '王五', action: '新增了角色', status: 'success' },
  { time: '09:45', user: '赵六', action: '登录失败', status: 'error' },
  { time: '09:30', user: '系统', action: '自动备份完成', status: 'success' },
])
</script>

<template>
  <div class="home-page">
    <div class="page-header">
      <div class="page-title">
        <h1>欢迎回来</h1>
        <p>这是基于 Vue 3 + TypeScript 构建的管理系统</p>
      </div>
      <div class="page-actions"></div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-grid">
      <div v-for="(stat, index) in stats" :key="stat.label" class="stat-card" :style="{ animationDelay: `${index * 0.1}s` }">
        <div class="stat-label">{{ stat.label }}</div>
        <div class="stat-value">{{ stat.value }}</div>
        <div class="stat-change" :class="stat.trend">
          <span v-if="stat.trend === 'up'">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
            </svg>
          </span>
          <span v-else>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/>
            </svg>
          </span>
          {{ stat.change }}
        </div>
      </div>
    </div>

    <!-- 内容区 -->
    <div class="content-grid">
      <!-- 快速操作 -->
      <div class="content-card quick-actions">
        <div class="card-header">
          <h3>快速操作</h3>
        </div>
        <div class="action-list">
          <div class="action-item">
            <div class="action-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="8.5" cy="7" r="4"/>
                <line x1="20" y1="8" x2="20" y2="14"/>
                <line x1="23" y1="11" x2="17" y2="11"/>
              </svg>
            </div>
            <div class="action-content">
              <div class="action-title">新增用户</div>
              <div class="action-desc">添加新用户账号</div>
            </div>
          </div>

          <div class="action-item">
            <div class="action-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <line x1="3" y1="9" x2="21" y2="9"/>
                <line x1="9" y1="21" x2="9" y2="9"/>
              </svg>
            </div>
            <div class="action-content">
              <div class="action-title">角色管理</div>
              <div class="action-desc">配置角色权限</div>
            </div>
          </div>

          <div class="action-item">
            <div class="action-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="3" y1="12" x2="21" y2="12"/>
                <line x1="3" y1="6" x2="21" y2="6"/>
                <line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </div>
            <div class="action-content">
              <div class="action-title">菜单配置</div>
              <div class="action-desc">编辑菜单结构</div>
            </div>
          </div>

          <div class="action-item">
            <div class="action-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
            </div>
            <div class="action-content">
              <div class="action-title">系统设置</div>
              <div class="action-desc">系统配置管理</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 最近动态 -->
      <div class="content-card recent-activity">
        <div class="card-header">
          <h3>最近动态</h3>
          <span class="more-link">查看全部</span>
        </div>
        <div class="activity-list">
          <div v-for="(item, index) in activities" :key="index" class="activity-item">
            <div class="activity-dot" :class="item.status"></div>
            <div class="activity-content">
              <div class="activity-text">
                <span class="activity-user">{{ item.user }}</span>
                {{ item.action }}
              </div>
              <div class="activity-time">{{ item.time }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.home-page {
  animation: fadeIn 0.4s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.page-header {
  margin-bottom: 32px;
}

.page-title h1 {
  font-size: 24px;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0 0 8px;
}

.page-title p {
  font-size: 14px;
  color: #666;
  margin: 0;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 24px;
}

.stat-card {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  border: 1px solid #f0f0f0;
  animation: fadeIn 0.5s ease-out both;
  transition: box-shadow 0.2s ease, transform 0.2s ease;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
    transform: translateY(-2px);
  }
}

.stat-label {
  font-size: 13px;
  color: #999;
  margin-bottom: 12px;
}

.stat-value {
  font-size: 28px;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 8px;
  letter-spacing: -0.5px;
}

.stat-change {
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 4px;

  &.up {
    color: #52c41a;
  }

  &.down {
    color: #ff4d4f;
  }

  svg {
    width: 14px;
    height: 14px;
  }
}

.content-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

.content-card {
  background: #fff;
  border-radius: 12px;
  border: 1px solid #f0f0f0;
  overflow: hidden;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid #f0f0f0;

  h3 {
    font-size: 15px;
    font-weight: 600;
    color: #1a1a1a;
    margin: 0;
  }
}

.more-link {
  font-size: 13px;
  color: #1890ff;
  cursor: pointer;

  &:hover {
    color: #40a9ff;
  }
}

.action-list {
  padding: 16px 24px 24px;
}

.action-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 16px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #fafafa;

    .action-icon {
      background: #1a1a1a;
      color: #fff;
    }
  }
}

.action-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  color: #666;

  svg {
    width: 20px;
    height: 20px;
  }
}

.action-title {
  font-size: 14px;
  font-weight: 500;
  color: #1a1a1a;
}

.action-desc {
  font-size: 12px;
  color: #999;
  margin-top: 2px;
}

.activity-list {
  padding: 16px 24px 24px;
}

.activity-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid #f5f5f5;

  &:last-child {
    border-bottom: none;
  }
}

.activity-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-top: 6px;
  flex-shrink: 0;

  &.success {
    background: #52c41a;
  }

  &.error {
    background: #ff4d4f;
  }
}

.activity-content {
  flex: 1;
}

.activity-text {
  font-size: 13px;
  color: #333;
  line-height: 1.5;
}

.activity-user {
  font-weight: 500;
  color: #1a1a1a;
  margin-right: 4px;
}

.activity-time {
  font-size: 12px;
  color: #bfbfbf;
  margin-top: 4px;
}

@media (max-width: 1200px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .content-grid {
    grid-template-columns: 1fr;
  }
}
</style>