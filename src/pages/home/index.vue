<script setup lang="ts">
// Home page
</script>

<template>
  <div class="home-page">
    <a-typography-title :heading="2">欢迎使用 Sea 管理系统</a-typography-title>
    <a-typography-paragraph>
      这是基于 Vue 3 + TypeScript + Arco Design 构建的前端项目。
    </a-typography-paragraph>

    <a-row :gutter="16" style="margin-top: 24px">
      <a-col :span="6">
        <a-statistic title="总用户数" :value="1280" :show-group-separator="true" />
      </a-col>
      <a-col :span="6">
        <a-statistic title="今日活跃" :value="580" :show-group-separator="true" />
      </a-col>
      <a-col :span="6">
        <a-statistic title="新增用户" :value="48" :show-group-separator="true" />
      </a-col>
      <a-col :span="6">
        <a-statistic title="系统消息" :value="12" :show-group-separator="true" />
      </a-col>
    </a-row>
  </div>
</template>

<style scoped lang="scss">
.home-page {
  padding: 8px;
}
</style>
