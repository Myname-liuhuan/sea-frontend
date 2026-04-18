<script setup lang="ts">
// About page
</script>

<template>
  <div class="about-page">
    <a-typography-title :heading="2">关于项目</a-typography-title>
    <a-descriptions :column="1" bordered>
      <a-descriptions-item label="项目名称">Sea Frontend</a-descriptions-item>
      <a-descriptions-item label="框架">Vue 3 (Composition API + script setup)</a-descriptions-item>
      <a-descriptions-item label="语言">TypeScript</a-descriptions-item>
      <a-descriptions-item label="构建工具">Vite</a-descriptions-item>
      <a-descriptions-item label="状态管理">Pinia</a-descriptions-item>
      <a-descriptions-item label="路由">Vue Router 4</a-descriptions-item>
      <a-descriptions-item label="UI 组件库">Arco Design Vue</a-descriptions-item>
      <a-descriptions-item label="HTTP 客户端">Axios</a-descriptions-item>
    </a-descriptions>
  </div>
</template>

<style scoped lang="scss">
.about-page {
  padding: 8px;
}
</style>
