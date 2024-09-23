<script setup lang="ts">
import { onBeforeMount, onBeforeUnmount, ref, computed, type Ref, type ComputedRef } from 'vue'
import Cargo from '@/services/cargo.js'
import { MessageType } from '@/services/WebRTC/commands/index'
import { Echo } from '@/services/WebRTC/commands/echo'

import SignalBars from './SignalBars.vue'
import type {
  ChannelStateEvent,
  ConnectionStateEvent,
  IncomingMessageEvent
} from '@/services/WebRTC/index.js'

const echoMS: Ref<number> = ref(0)

const tresholds = [75, 125, 175, 225, 275]
let intervalReferenceId: ReturnType<typeof setInterval> | undefined = undefined

const signalStrength: ComputedRef<number> = computed(() => {
  if (echoMS.value === 0) return 0

  return tresholds.filter((treshold) => treshold > echoMS.value).length
})

const unsubscribeIncoming = Cargo.PubSubService.subscribe(
  `incoming.${MessageType.ECHO}`,
  (event: IncomingMessageEvent) => {
    // TODO: create EchoMessageEvent
    const message = event.message as Echo

    echoMS.value = Date.now() - Number(message.payload)
  }
)

/**
 * Clear the latency value upon diconnect
 */
const unsubscribeConnectionState = Cargo.PubSubService.subscribe(
  'connection.connectionStateChange',
  (event: ConnectionStateEvent) => {
    if (event.state && ['closed', 'disconnected', 'failed'].includes(event.state)) {
      echoMS.value = 0
      stopPing()
    } else {
      startPing()
    }
  }
)

const unsubscribeChannelState = Cargo.PubSubService.subscribe(
  'connection.channelStateChange',
  (event: ChannelStateEvent) => {
    if (event.state && ['closed', 'closing'].includes(event.state)) {
      echoMS.value = 0
      stopPing()
    } else {
      startPing()
    }
  }
)

const startPing = function startPing() {
  if (!intervalReferenceId) {
    intervalReferenceId = setInterval(() => {
      Cargo.echo()
    }, 1000)
  }
}
const stopPing = function stopPing() {
  if (intervalReferenceId) {
    clearInterval(intervalReferenceId)
    intervalReferenceId = undefined
  }
}

onBeforeMount(() => {
  setTimeout(() => {
    if (Cargo.isConnected()) {
      startPing()
    }
  })
})

onBeforeUnmount(() => {
  stopPing()

  unsubscribeIncoming()
  unsubscribeConnectionState()
  unsubscribeChannelState()
})
</script>

<template>
  <div class="Ping">
    <div class="Ping__figure">
      {{ echoMS === 0 ? '-' : echoMS }}
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
