<script setup lang="ts">
// This starter template is using Vue 3 <script setup> SFCs
// Check out https://vuejs.org/api/sfc-script-setup.html#script-setup


</script>

<template>
  <div class="container">
    <div class="menu-item">显示工具条</div>
    <div class="menu-item">复制到剪切板</div>
    <div class="menu-item">保存到文件</div>
    <div class="menu-item">关闭窗口</div>
  </div>
</template>

<style scoped>
.container {
  flex-direction: column;
  display: flex;
  margin: 0;
  padding: 0;
}

.container .menu-item {
  padding: 5px 10px;
  color: #eff0f1;
  cursor: pointer;
}

.container .menu-item:hover {
  background: #0860f2;
}

.container .menu-item:active {
  transform: scale(0.95);
}

</style>
