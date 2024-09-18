<script setup lang="ts">
import { ref, type Ref } from 'vue'
import Cargo from '@/services/cargo.js'
import { MessageType } from '@/services/WebRTC/commands/index'
import { Engine } from '@/services/WebRTC/commands/engine'

import StartButton from '@/components/StartButton.vue'
import RPMControls from '@/components/RPMControls.vue'

const RPM: Ref<number> = ref(0)

Cargo.subscribe(MessageType.ENGINE, (event: Engine) => {
  RPM.value = event.rpm
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
  line-height: 1;
  min-width: 9rem;
  text-align: center;
  user-select: none;
}
</style>
