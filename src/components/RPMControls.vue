<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import Cargo from '@/services/cargo.js';
import Up from '@/components/icons/up.vue'
import Down from '@/components/icons/down.vue'

const props = withDefaults(
  defineProps<{ RPM: number }>(), {
    RPM: 0
  }
)
const disableUp = computed(() => props.RPM > 2000 || props.RPM < 600)
const disableDown = computed(() => props.RPM < 800)

const handleIncreaseRPM = function() {
  if (disableUp.value) {
    return
  }

  // Add 100 rpm to current rpm
  // Round up to next 100 multiplier
  // Cap at 2100
  const RPM = Math.min(
    Math.ceil((props.RPM + 100) / 100) * 100, 
    2100
  )

  console.log(props.RPM, RPM)

  Cargo.engineRequestRPM(RPM)
}

const handleDecreaseRPM = function() {
  if (disableDown.value) {
    return
  }

  // Deduct 100 rpm to current rpm
  // Round down to next 100 multiplier
  // Cap at 700
  const RPM = Math.max(
    Math.ceil((props.RPM - 100) / 100) * 100, 
    700
  )
  console.log(props.RPM, RPM)

  Cargo.engineRequestRPM(RPM)
}

</script>

<template>
  <div class="RPM__controls">
    <Up 
      :class="{ disabled: disableUp }" 
      @click="handleIncreaseRPM" />
    <Down 
      :class="{ disabled: disableDown }" 
      @click="handleDecreaseRPM" />
  </div>
</template>

<style>
.RPM__controls {
  display: flex;
  flex-direction: column;
}
.RPM__controls svg {
  width: 1.2rem;
}
.RPM__controls svg:hover {
  fill: white;
  cursor: pointer;
}
.RPM__controls svg.disabled {
  fill: #323232;
  cursor: not-allowed;
}
</style>