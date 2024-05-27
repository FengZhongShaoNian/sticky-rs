<script setup lang="ts">
// This starter template is using Vue 3 <script setup> SFCs
// Check out https://vuejs.org/api/sfc-script-setup.html#script-setup

import {CustomEvent, sendEventToMainWindow} from "../../common/custom-event.ts";
import {appWindow, WebviewWindow} from "@tauri-apps/api/window";

async function toggleToolbar(){
  await sendEventToMainWindow(CustomEvent.MENU_TOGGLE_TOOLBAR, {});
  await appWindow.hide();
}
async function copyToClipboard(){
  await sendEventToMainWindow(CustomEvent.MENU_COPY_TO_CLIPBOARD, {});
  await appWindow.hide();
}

async function saveToFile(){
  await sendEventToMainWindow(CustomEvent.MENU_SAVE_TO_FILE, {});
  await appWindow.hide();
}

async function closeWindow(){
  await sendEventToMainWindow(CustomEvent.MENU_CLOSE_WINDOW, {});
  await appWindow.hide();
}

</script>

<template>
  <div class="container">
    <div class="menu-item" @click="toggleToolbar">显示/隐藏工具条</div>
    <div class="menu-item" @click="copyToClipboard">复制到剪切板</div>
    <div class="menu-item" @click="saveToFile">保存到文件</div>
    <div class="menu-item" @click="closeWindow">关闭窗口</div>
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
  padding: 5px 5px;
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
