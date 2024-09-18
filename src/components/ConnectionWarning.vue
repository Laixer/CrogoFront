<script setup lang="ts">
import { ref } from 'vue'
import Warning from '@/components/Warning.vue'
import Cargo from '@/services/cargo.js'

/**
 * This CONNECTION warning has 2 categories:
 *  - Unstable: this warning appears when we do not receive any type of WebRTC message for `timeoutTreshold` milliseconds
 *  - Lost: this warning appears when the WebRTC state changes to 'closed', 'disconnected' or 'failed', or any of the data channels is closing/closed
 *
 * Lost state is a higher priority than Unstable.
 */
const timeoutTreshold = 300 // ms

const show = ref(false)
const label = ref('CONNECTION LOST')

let timeoutReference: ReturnType<typeof setTimeout> | undefined = undefined

// Subscribe to all message types, before ignoring duplicates
Cargo.subscribe('*', () => {
  // Clear the warning when a message arrives.
  // This typically creates a flashing effect in case the unstable connection warning is triggered
  show.value = false

  if (timeoutReference) {
    clearTimeout(timeoutReference)
  }

  timeoutReference = setTimeout(() => {
    // We're either already showing the Unstable warning, or showing the Lost warning, which is more important
    if (show.value === false) {
      label.value = 'CONNECTION UNSTABLE'
      show.value = true
    }
  }, timeoutTreshold)
})

// Possible states: "closed" | "connected" | "connecting" | "disconnected" | "failed" | "new"
Cargo.subscribe('connectionStateChange', (state: RTCPeerConnectionState) => {
  console.log('Subscribe connection warning', state)

  if (['closed', 'disconnected', 'failed'].includes(state)) {
    // Upon connection failure, the connection unstable notice is cancelled
    if (timeoutReference) {
      clearTimeout(timeoutReference)
    }

    label.value = 'CONNECTION LOST'
    show.value = true
  }
})

// (current) Possible states: "closed" or "closing"
Cargo.subscribe('channelStateChange', (state: string) => {
  if (['closed', 'closing'].includes(state)) {
    // Upon connection failure, the connection unstable notice is cancelled
    if (timeoutReference) {
      clearTimeout(timeoutReference)
    }

    label.value = 'CONNECTION LOST'
    show.value = true
  }
})
</script>

<template>
  <Warning v-if="show" :label="label" />
</template>
