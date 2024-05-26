<script setup lang="ts">
// This starter template is using Vue 3 <script setup> SFCs
// Check out https://vuejs.org/api/sfc-script-setup.html#script-setup
</script>

<template>
  <div class="container">
    <img class="svg-button" src="../../assets/icons/draw-rectangle.svg" title="draw rectangle">
    <img class="svg-button" src="../../assets/icons/draw-ellipse.svg" title="draw ellipse"/>
    <img class="svg-button" src="../../assets/icons/draw-line.svg" title="draw line"/>
    <img class="svg-button" src="../../assets/icons/draw-arrow.svg" title="draw arrow"/>
    <img class="svg-button" src="../../assets/icons/draw-freehand.svg" title="draw freehand"/>
    <img class="svg-button" src="../../assets/icons/draw-highlight.svg" title="draw highlight"/>
    <img class="svg-button" src="../../assets/icons/pixelart-trace.svg" title="pixelart trace"/>
    <img class="svg-button" src="../../assets/icons/blurfx.svg" title="blur"/>
    <img class="svg-button" src="../../assets/icons/draw-text.svg" title="draw text"/>
    <img class="svg-button" src="../../assets/icons/draw-number.svg" title="draw number"/>
    <img class="svg-button" src="../../assets/icons/document-save.svg" title="save"/>
    <img class="svg-button" src="../../assets/icons/edit-copy.svg" title="copy to clipboard"/>
  </div>
</template>

<style scoped>
.container {
  flex-direction: row;
  display: flex;
  margin: 0;
  padding: 0;
}
.svg-button {
  cursor: pointer;
  transition: transform 0.2s ease-in-out;
  padding: 5px 10px;
}
.svg-button:active {
  transform: scale(0.95);
  background: #535bf2;
}
.svg-button:hover {
  background: #2980b9;
}
</style>
