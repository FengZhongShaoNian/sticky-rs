<script setup lang="ts">
const props = defineProps<{
  checked: boolean
  title: string
  icon: string
}>()
</script>

<template>
  <img class="svg-button" :data-checked="props.checked" :alt="props.title" :src="props.icon" :title="props.title">
</template>

<style scoped>
.svg-button {
  cursor: pointer;
  transition: transform 0.2s ease-in-out;
  padding: 5px 5px;
}

.svg-button:active {
  transform: scale(0.95);
  background: #535bf2;
}

.svg-button:hover {
  background: #2980b9;
}

.svg-button[data-checked="true"] {
  background: #535bf2;
}
</style>