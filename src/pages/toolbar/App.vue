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
import {reactive} from "vue";

const buttons = reactive([
  {checkable: true, checked: false, title: 'draw rectangle', icon: iconDrawRectangle},
  {checkable: true, checked: false, title: 'draw ellipse', icon: iconDrawEllipse},
  {checkable: true, checked: false, title: 'draw line', icon: iconDrawLine},
  {checkable: true, checked: false, title: 'draw arrow', icon: iconDrawArrow},
  {checkable: true, checked: false, title: 'draw freehand', icon: iconDrawFreehand},
  {checkable: true, checked: false, title: 'draw highlight', icon: iconDrawHighlight},
  {checkable: true, checked: false, title: 'mosaic', icon: iconPixelartTrace},
  {checkable: true, checked: false, title: 'blur', icon: iconBlurfx},
  {checkable: true, checked: false, title: 'draw text', icon: iconDrawText},
  {checkable: true, checked: false, title: 'draw number', icon: iconDrawNumber},
  {checkable: true, checked: false, title: 'eraser', icon: iconDrawEraser},
  {checkable: false, checked: false, title: 'undo', icon: iconEditUndo},
  {checkable: false, checked: false, title: 'redo', icon: iconEditRedo},
  {checkable: false, checked: false, title: 'save', icon: iconDocumentSave},
  {checkable: false, checked: false, title: 'copy', icon: iconEditCopy},
  {checkable: false, checked: false, title: 'ok', icon: iconDialogOK},
]);

function onButtonClicked(buttonIndex: number){
  let targetButton = buttons[buttonIndex];
  if(targetButton.checkable){
    targetButton.checked = true;
    for (let i = 0; i < buttons.length; i++) {
      if(i != buttonIndex){
        buttons[i].checked=false;
      }
    }
  }

}
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
