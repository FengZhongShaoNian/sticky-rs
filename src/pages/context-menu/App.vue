<script setup lang="ts">
// This starter template is using Vue 3 <script setup> SFCs
// Check out https://vuejs.org/api/sfc-script-setup.html#script-setup

import {CustomEvent, sendEventToMainWindow} from "../../common/custom-event.ts";
import {appWindow} from "@tauri-apps/api/window";
import {i18n} from '../../common/translation.ts'

async function toggleToolbar(){
  await sendEventToMainWindow(CustomEvent.MENU_TOGGLE_TOOLBAR, {});
  await appWindow.hide();
}
async function copyToClipboard(){
  await sendEventToMainWindow(CustomEvent.MENU_COPY_TO_CLIPBOARD, {});
  await appWindow.hide();
}

async function exportToFile(){
  await sendEventToMainWindow(CustomEvent.MENU_EXPORT_TO_FILE, {});
  await appWindow.hide();
}

async function closeWindow(){
  await sendEventToMainWindow(CustomEvent.MENU_CLOSE_WINDOW, {});
  await appWindow.hide();
}

async function openDevTools(){
  await sendEventToMainWindow(CustomEvent.MENU_OPEN_DEV_TOOLS, {});
  await appWindow.hide();
}

</script>

<template>
  <div class="container">
    <div class="menu-item" @click="toggleToolbar">{{i18n.t('contextMenu.showOrHideToolbar')}}</div>
    <div class="menu-item" @click="copyToClipboard">{{i18n.t('contextMenu.copyToClipboard')}}</div>
    <div class="menu-item" @click="exportToFile">{{i18n.t('contextMenu.exportToFile')}}</div>
    <div class="menu-item" @click="closeWindow">{{i18n.t('contextMenu.closeWindow')}}</div>
    <div class="menu-item" @click="openDevTools">{{i18n.t('contextMenu.openDevTools')}}</div>
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
  padding: 5px 25px;
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
