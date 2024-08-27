<script setup lang="ts">

import { onBeforeUnmount, ref, computed, type Ref, type ComputedRef } from 'vue';
import Cargo from '@/services/cargo.js';
import { MessageType } from "@/services/WebRTC/commands/index"
import { Echo } from "@/services/WebRTC/commands/echo"

import SignalBars from './SignalBars.vue'

const echoMS: Ref<number> = ref(0)

const tresholds = [
  75,
  125,
  175,
  225,
  275
]

const signalStrength: ComputedRef<number> = computed(() => {
  if (echoMS.value === 0) return 0

  return tresholds.filter(treshold => treshold > echoMS.value).length
})

Cargo.subscribe(MessageType.ECHO, (event: Echo) => {
  echoMS.value = Date.now() - Number(event.payload)
})

/**
 * Clear the latency value upon diconnect
 */
Cargo.subscribe("connectionStateChange", (state: RTCPeerConnectionState) => {
  if (['closed', 'disconnected', 'failed'].includes(state)) {
    echoMS.value = 0
  }
})

Cargo.subscribe("channelStateChange", (state: string) => {
  if (['closed', 'closing'].includes(state)) {
    echoMS.value = 0
  }
})

const intervalReferenceId = setInterval(() => {
  Cargo.echo()
}, 1000);

onBeforeUnmount(() => {
  if (intervalReferenceId) {
    clearInterval(intervalReferenceId)
  }
})

</script>

<template>
  <div class="Ping">
    <div class="Ping__figure">
      {{ echoMS === 0 ? '-': echoMS }}
    </div>
    <SignalBars :bars="signalStrength" />
  </div>
</template>

<style>

.Ping {
  position: relative;
  color: white;
}
.Ping__figure {
  position: absolute;
  top: 0;
  left: 0;
  font-weight: bold;
  line-height: 1;
}
</style>