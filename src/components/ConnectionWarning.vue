<script setup lang="ts">
import { ref } from 'vue'
import Warning from '@/components/Warning.vue'
import Cargo from '@/services/cargo.js';

/**
 * This CONNECTION warning has 2 categories:
 *  - Unstable: this warning appears when we do not receive any type of WebRTC message for `timeoutTreshold` milliseconds
 *  - LOST: this warning appears when the WebRTC state changes to 'closed', 'disconnected' or 'failed'
 */
const timeoutTreshold = 300 // ms

const show = ref(false)
const label = ref("CONNECTION LOST")

let timeoutReference: ReturnType<typeof setTimeout>|undefined = undefined

// Subscribe to all message types, before ignoring duplicates
Cargo.subscribe("*", () => {
  show.value = false

  if (timeoutReference) {
    clearTimeout(timeoutReference)
  }

  timeoutReference = setTimeout(() => {
    if (show.value === false) {
      label.value = "CONNECTION UNSTABLE"
      show.value = true
    }
  }, timeoutTreshold)
})

// Possible states: "closed" | "connected" | "connecting" | "disconnected" | "failed" | "new"
Cargo.subscribe("connectionStateChange", (state: RTCPeerConnectionState) => {
  console.log("Subscribe connection warning", state)

  if (['closed', 'disconnected', 'failed'].includes(state)) {
    if (timeoutReference) {
      clearTimeout(timeoutReference)
    }

    label.value = "CONNECTION LOST"
    show.value = true
  } else {
    show.value = false
  }
})

// (current) Possible states: "closing"
Cargo.subscribe("channelStateChange", (state: string) => {
  if (state === 'closing') {
    if (timeoutReference) {
      clearTimeout(timeoutReference)
    }

    label.value = "CONNECTION LOST"
    show.value = true
  }
})


</script>

<template> 
  <Warning 
    v-if="show"
    :label="label" />
</template>