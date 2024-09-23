<script setup lang="ts">
import { onBeforeUnmount, ref, type Ref } from 'vue'
import Cargo from '@/services/cargo.js'
import Button from './Button.vue'
import type { ConnectionStateEvent } from '@/services/WebRTC/index.js'

const isConnected: Ref<boolean> = ref(Cargo.isConnected())

// TODO: Have 1 Cargo connection state (not connectionStateChange and channelStateChange)
const unsubscribe = Cargo.PubSubService.subscribe(
  'connection.connectionStateChange',
  (event: ConnectionStateEvent) => {
    if (event.state) {
      isConnected.value = !['closed', 'failed', 'disconnected'].includes(event.state)
    }
  }
)
onBeforeUnmount(() => {
  unsubscribe()
})
</script>

<template>
  <Button v-if="!isConnected" class="ConnectBtn" small secondary> connect </Button>
</template>

<style>
.ConnectBtn {
  width: 9rem;
  line-height: 1.25;
}
</style>
