<script setup lang="ts">
import { ref, type Ref } from 'vue'
import Cargo from '@/services/cargo.js'
import Gamepad from '@/components/icons/gamepad.vue'

const connected: Ref<boolean> = ref(false)

Cargo.PubSubService.subscribe('gamepad.connect', () => {
  console.log('gamepad connected')
  connected.value = true
})
Cargo.PubSubService.subscribe('gamepad.disconnect', () => {
  console.log('gamepad disconnected')
  connected.value = false
})
</script>

<template>
  <div
    class="GamePadIncidator"
    :class="{
      'GamePadIncidator--connected': connected,
      'GamePadIncidator--disconnected': !connected
    }"
  >
    <Gamepad />
  </div>
</template>

<style>
.GamePadIncidator {
  font-size: 3rem;
  color: var(--vt-c-text-dark-2);
  line-height: 1;
  text-align: center;
  user-select: none;
}
.GamePadIncidator svg {
  width: 4rem;
  height: 4rem;
}
.GamePadIncidator--disconnected svg {
  fill: #d90000;
}
.GamePadIncidator--connected svg {
  fill: #04aa6d;
}
</style>
