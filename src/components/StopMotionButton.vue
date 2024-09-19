<script setup lang="ts">
import Cargo from '@/services/cargo.js'
import Button from './Button.vue'

const handleStopMotion = function handleStopMotion() {
  Cargo.stopAllMotion()
}
</script>

<template>
  <Button class="StopMotion" small secondary @click="handleStopMotion"> lock motion </Button>
</template>

<style>
.StopMotion {
  width: 9rem;
  line-height: 1.25;
}
</style>
