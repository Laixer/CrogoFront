<script setup lang="ts">
import { onBeforeUnmount, ref, type Ref } from 'vue'
import Cargo from '@/services/cargo.js'
import { MessageType } from '@/services/WebRTC/commands/index'
import { Engine } from '@/services/WebRTC/commands/engine'

import StartButton from '@/components/StartButton.vue'
import RPMControls from '@/components/RPMControls.vue'
import type { IncomingMessageEvent } from '@/services/WebRTC/index.js'

const RPM: Ref<number> = ref(0)

const unsubscribeIncoming = Cargo.PubSubService.subscribe(
  `incoming.${MessageType.ENGINE}`,
  (event: IncomingMessageEvent) => {
    // TODO: create EngineMessageEvent
    const message = event.message as Engine

    RPM.value = message.rpm
  }
)

onBeforeUnmount(() => {
  unsubscribeIncoming()
})
</script>

<template>
  <div class="RPM">
    <div class="flex">
      <div class="flex-grow">
        {{ RPM }}
      </div>
      <RPMControls :RPM="RPM" />
    </div>

    <StartButton :RPM="RPM" />
  </div>
</template>

<style>
.RPM {
  font-size: 3rem;
  color: var(--vt-c-text-dark-2);
  line-height: 1;
  min-width: 9rem;
  text-align: center;
  user-select: none;
}
</style>
