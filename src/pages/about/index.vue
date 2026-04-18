<script setup lang="ts">
// About page
</script>

<template>
  <div class="about-page">
    <div class="page-header">
      <h1>关于项目</h1>
      <p>Sea Admin 管理系统</p>
    </div>

    <div class="about-grid">
      <div class="about-card">
        <div class="card-icon">
          <svg viewBox="0 0 32 32" fill="none">
            <path d="M16 4L28 10V22L16 28L4 22V10L16 4Z" stroke="currentColor" stroke-width="2"/>
            <path d="M16 10L22 13V19L16 22L10 19V13L16 10Z" fill="currentColor"/>
          </svg>
        </div>
        <div class="card-content">
          <h3>Sea Admin</h3>
          <p>一个现代化的管理系统</p>
        </div>
      </div>

      <div class="info-card">
        <h3>技术栈信息</h3>
        <div class="info-list">
          <div class="info-item">
            <span class="info-label">前端框架</span>
            <span class="info-value">Vue 3 (Composition API)</span>
          </div>
          <div class="info-item">
            <span class="info-label">语言</span>
            <span class="info-value">TypeScript</span>
          </div>
          <div class="info-item">
            <span class="info-label">构建工具</span>
            <span class="info-value">Vite</span>
          </div>
          <div class="info-item">
            <span class="info-label">状态管理</span>
            <span class="info-value">Pinia</span>
          </div>
          <div class="info-item">
            <span class="info-label">路由</span>
            <span class="info-value">Vue Router 4</span>
          </div>
          <div class="info-item">
            <span class="info-label">UI 组件库</span>
            <span class="info-value">Arco Design Vue</span>
          </div>
          <div class="info-item">
            <span class="info-label">HTTP 客户端</span>
            <span class="info-value">Axios</span>
          </div>
          <div class="info-item">
            <span class="info-label">版本</span>
            <span class="info-value">v1.0.0</span>
          </div>
        </div>
      </div>
    </div>

    <div class="feature-card">
      <h3>功能特性</h3>
      <div class="feature-grid">
        <div class="feature-item">
          <div class="feature-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </div>
          <div class="feature-text">
            <h4>安全认证</h4>
            <p>基于 JWT 的身份认证</p>
          </div>
        </div>
        <div class="feature-item">
          <div class="feature-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <line x1="3" y1="9" x2="21" y2="9"/>
              <line x1="9" y1="21" x2="9" y2="9"/>
            </svg>
          </div>
          <div class="feature-text">
            <h4>动态菜单</h4>
            <p>基于 RBAC 权限控制</p>
          </div>
        </div>
        <div class="feature-item">
          <div class="feature-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
            </svg>
          </div>
          <div class="feature-text">
            <h4>微服务架构</h4>
            <p>Spring Cloud 体系</p>
          </div>
        </div>
        <div class="feature-item">
          <div class="feature-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>
          <div class="feature-text">
            <h4>实时响应</h4>
            <p>流畅的用户体验</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.about-page {
  animation: fadeIn 0.4s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

.page-header {
  margin-bottom: 32px;

  h1 {
    font-size: 24px;
    font-weight: 600;
    color: #1a1a1a;
    margin: 0 0 8px;
  }

  p {
    font-size: 14px;
    color: #666;
    margin: 0;
  }
}

.about-grid {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 24px;
  margin-bottom: 24px;
}

.about-card {
  background: #fff;
  border-radius: 12px;
  border: 1px solid #f0f0f0;
  padding: 32px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.card-icon {
  width: 80px;
  height: 80px;
  color: #1a1a1a;
  margin-bottom: 16px;

  svg {
    width: 100%;
    height: 100%;
  }
}

.card-content h3 {
  font-size: 20px;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0 0 8px;
}

.card-content p {
  font-size: 14px;
  color: #999;
  margin: 0;
}

.info-card,
.feature-card {
  background: #fff;
  border-radius: 12px;
  border: 1px solid #f0f0f0;
  padding: 24px;
}

.info-card h3,
.feature-card h3 {
  font-size: 15px;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0 0 20px;
}

.info-list {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  padding: 12px 16px;
  background: #fafafa;
  border-radius: 8px;
}

.info-label {
  font-size: 13px;
  color: #999;
}

.info-value {
  font-size: 13px;
  color: #333;
  font-weight: 500;
}

.feature-card {
  margin-top: 0;
}

.feature-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.feature-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  border-radius: 8px;
  transition: all 0.2s ease;

  &:hover {
    background: #fafafa;
  }
}

.feature-icon {
  width: 40px;
  height: 40px;
  background: #f5f5f5;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
  flex-shrink: 0;

  svg {
    width: 20px;
    height: 20px;
  }

  .feature-item:hover & {
    background: #1a1a1a;
    color: #fff;
  }
}

.feature-text h4 {
  font-size: 14px;
  font-weight: 500;
  color: #1a1a1a;
  margin: 0 0 4px;
}

.feature-text p {
  font-size: 12px;
  color: #999;
  margin: 0;
}

@media (max-width: 1200px) {
  .about-grid {
    grid-template-columns: 1fr;
  }

  .feature-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>