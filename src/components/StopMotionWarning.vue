<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue'
import Warning from '@/components/Warning.vue'
import Cargo from '@/services/cargo.js'
import { MessageType } from '@/services/WebRTC/commands/index'
import { Motion, MotionType } from '@/services/WebRTC/commands/motion'
import type { IncomingMessageEvent } from '@/services/WebRTC/index.js'

const show = ref(false)

const unsubscribeIncoming = Cargo.PubSubService.subscribe(
  `incoming.${MessageType.MOTION}`,
  (event: IncomingMessageEvent) => {
    // TODO: create MotionMessageEvent
    const message = event.message as Motion

    show.value = message.type === MotionType.STOP_ALL
  }
)

onBeforeUnmount(() => {
  unsubscribeIncoming()
})
</script>

<template>
  <Warning v-if="show" label="MOTION LOCKED" />
</template>
