<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import Cargo from '@/services/cargo.js'

import Button from './Button.vue'

const props = defineProps({
  RPM: { type: Number },
})

const isStarting = ref(false)

const isRunning = computed(() => props.RPM !== 0)

const disabled = computed(() => {
  return isStarting.value || isRunning.value
})

watch(
  () => isStarting.value, 
  (starting) => starting && setTimeout(() => isStarting.value = false, 1500)
)

const handleClick = function handleClick() {
  if (disabled.value) {
    return
  }

  isStarting.value = true
  Cargo.engineRequestRPM(700)
}
</script>

<template>
  <Button 
    v-if="! isRunning"
    class="StartButton"
    small
    :disabled="!! disabled"
    @click="handleClick">
    start
  </Button>
</template>

<style>
.StartButton {
  min-width: 9rem;
  line-height: 1.25;
}
</style>

