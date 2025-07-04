<script setup lang="ts">
// This starter template is using Vue 3 <script setup> SFCs
// Check out https://vuejs.org/api/sfc-script-setup.html#script-setup

import iconDrawRectangle from "../../assets/icons/draw-rectangle.svg?url";
import iconDrawEllipse from "../../assets/icons/draw-ellipse.svg?url";
import iconDrawLine from "../../assets/icons/draw-line.svg?url";
import iconDrawArrow from "../../assets/icons/draw-arrow.svg?url";
import iconDrawFreehand from "../../assets/icons/draw-freehand.svg?url";
import iconDrawHighlight from "../../assets/icons/draw-highlight.svg?url";
import iconPixelartTrace from "../../assets/icons/pixelart-trace.svg?url";
import iconBlurfx from "../../assets/icons/blurfx.svg?url";
import iconDrawText from "../../assets/icons/draw-text.svg?url";
import iconDrawNumber from "../../assets/icons/draw-number.svg?url";
import iconDrawEraser from "../../assets/icons/draw-eraser.svg?url";
import iconEditUndo from "../../assets/icons/edit-undo.svg?url";
import iconEditRedo from "../../assets/icons/edit-redo.svg?url";
import iconDocumentSave from "../../assets/icons/document-save.svg?url";
import iconEditCopy from "../../assets/icons/edit-copy.svg?url";
import iconDialogOK from "../../assets/icons/dialog-ok.svg?url";

import SvgButton from "../../components/SvgButton.vue";
import {onMounted, reactive} from "vue";
import {getMainWindowLabel} from "../../common/window-label.ts";
import {WebviewWindow} from "@tauri-apps/api/webviewWindow";
import {CustomEvent, sendEventToMainWindow} from "../../common/custom-event.ts";
import {ToolName} from "../../common/tool-name.ts";

import {i18n} from "../../common/translation.ts"

const mainWindowLabel = getMainWindowLabel();

const buttons = reactive([
  {toolName: ToolName.RECTANGLE_TOOL, checkable: true, checked: false, title: i18n.t('toolbar.rectangleTool'), icon: iconDrawRectangle},
  {toolName: ToolName.ELLIPSE_TOOL, checkable: true, checked: false, title: i18n.t('toolbar.ellipseTool'), icon: iconDrawEllipse},
  {toolName: ToolName.STRAIGHT_LINE_TOOL, checkable: true, checked: false, title: i18n.t('toolbar.straightLineTool'), icon: iconDrawLine},
  {toolName: ToolName.ARROW_TOOL, checkable: true, checked: false, title: i18n.t('toolbar.arrowTool'), icon: iconDrawArrow},
  {toolName: ToolName.FREE_CURVE_TOOL, checkable: true, checked: false, title: i18n.t('toolbar.freeCurveTool'), icon: iconDrawFreehand},
  {toolName: ToolName.MARKER_PEN_TOOL, checkable: true, checked: false, title: i18n.t('toolbar.markerPenTool'), icon: iconDrawHighlight},
  {toolName: ToolName.MOSAIC_TOOL, checkable: true, checked: false, title: i18n.t('toolbar.mosaicTool'), icon: iconPixelartTrace},
  {toolName: ToolName.GAUSSIAN_BLUR_TOOL, checkable: true, checked: false, title: i18n.t('toolbar.gaussianBlurTool'), icon: iconBlurfx},
  {toolName: ToolName.TEXT_TOOL, checkable: true, checked: false, title: i18n.t('toolbar.textTool'), icon: iconDrawText},
  {toolName: ToolName.NUMBER_TOOL, checkable: true, checked: false, title: i18n.t('toolbar.numberTool'), icon: iconDrawNumber},
  {toolName: ToolName.ERASER_TOOL, checkable: true, checked: false, title: i18n.t('toolbar.eraserTool'), icon: iconDrawEraser},
  {toolName: ToolName.UNDO_TOOL, checkable: false, checked: false, title: i18n.t('toolbar.undoTool'), icon: iconEditUndo},
  {toolName: ToolName.REDO_TOOL, checkable: false, checked: false, title: i18n.t('toolbar.redoTool'), icon: iconEditRedo},
  {toolName: ToolName.SAVE_TOOL, checkable: false, checked: false, title: i18n.t('toolbar.saveTool'), icon: iconDocumentSave},
  {toolName: ToolName.COPY_TOOL, checkable: false, checked: false, title: i18n.t('toolbar.copyTool'), icon: iconEditCopy},
  {toolName: ToolName.OK_TOOL, checkable: false, checked: false, title: i18n.t('toolbar.okTool'), icon: iconDialogOK},
]);

async function onButtonClicked(buttonIndex: number){
  let targetButton = buttons[buttonIndex];
  if(targetButton.checkable && targetButton.checked){
    return
  }
  if(targetButton.checkable){
    targetButton.checked = true;
    for (let i = 0; i < buttons.length; i++) {
      if(i != buttonIndex){
        buttons[i].checked=false;
      }
    }
  }

  await sendEventToMainWindow(CustomEvent.TOOLBAR_BUTTON_CLICK, targetButton.toolName);
}

function resetButtons(){
  for (let i = 0; i < buttons.length; i++) {
    buttons[i].checked = false;
  }
}

onMounted(()=>{
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      resetButtons();
    }
  });
})

</script>

<template>
  <div class="container">
    <SvgButton  v-for="(item, index) in buttons" @click="()=>onButtonClicked(index)" :checked="item.checked" :icon="item.icon" :title="item.title"/>
  </div>
</template>

<style scoped>
.container {
  flex-direction: row;
  display: flex;
  margin: 0;
  padding: 0;
}
</style>
