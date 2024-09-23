<script setup lang="ts">
import { onBeforeUnmount, type Ref, ref, watch } from 'vue'
import Cargo from '@/services/cargo.js'

import Ping from '@/components/Ping.vue'
import RPM from '@/components/RPM.vue'
import EmergencyButton from '@/components/EmergencyButton.vue'
import StopMotionButton from '@/components/StopMotionButton.vue'
import DisconnectButton from '@/components/DisconnectButton.vue'
import StopMotionWarning from '@/components/StopMotionWarning.vue'
import ConnectionWarning from '@/components/ConnectionWarning.vue'
import GamepadIndicator from '@/components/GamepadIndicator.vue'
import LoginModal from '@/components/LoginModal.vue'
import Video from '@/components/Video.vue'
import type { ConnectionStateEvent } from '@/services/WebRTC/index.js'
import { useWindowFocus } from '@/utils/useFocus.js'

// Alternative UI, where UI elements are presented on top of video
const enableOverlay = false

// Going to be false initially
const isConnected: Ref<boolean> = ref(Cargo.isConnected())

// Track changes in the connection state
// TODO: Have 1 Cargo connection state (not connectionStateChange and channelStateChange)
Cargo.PubSubService.subscribe('connection.connectionStateChange', (event: ConnectionStateEvent) => {
  if (event.state) {
    isConnected.value = !['closed', 'failed', 'disconnected'].includes(event.state)
  }
})

try {
  await Cargo.init()
} catch (err) {
  console.log(err)
}

/**
 * Stop all motion when tab goes out of focus
 *  No resume on focus to avoid unexpected activity
 */
watch(useWindowFocus(), (focus) => {
  if (!focus) {
    console.log('Window out of focus - stop all motion')
    Cargo.stopAllMotion()
  }
})

onBeforeUnmount(() => {
  try {
    Cargo.disconnect()
  } catch (e) {
    console.log('Unable to disconnect')
  }
})
</script>

<template>
  <LoginModal v-if="!isConnected" />

  <div v-else class="videoContainer">
    <Video />
    <div class="overlay flex column top bottom left">
      <ConnectionWarning class="mt-1 ml-1" />
      <StopMotionWarning class="mt-1 ml-1" />
    </div>

    <template v-if="enableOverlay">
      <div class="overlay top right flex column justify-end align-end mt-1 mr-1">
        <div class="flex inline">
          <Ping class="mr-1" />
          <RPM />
        </div>
        <div class="flex column justify-end align-end mt-1" style="color: black">
          <StopMotionButton />
          <DisconnectButton class="mt-1" />
        </div>
      </div>

      <div class="overlay bottom right mb-1 mr-1">
        <EmergencyButton />
      </div>
    </template>

    <template v-else>
      <div class="sidebar absolute top bottom flex column align-end px-1 py-1">
        <Ping />
        <RPM class="mt-1" />
        <StopMotionButton class="mt-1" />
        <DisconnectButton class="mt-1" />

        <GamepadIndicator class="mt-1" />

        <EmergencyButton class="absolute bottom right mx-1 mb-1 left right" />
      </div>
    </template>
  </div>
</template>

<style>
html,
body {
  background-color: #032836;
}

.videoContainer {
  position: relative;
  display: flex;
  min-width: 1280px;
  min-height: 720px;
  max-width: 100vw;
  max-height: 100vh;
  overflow: visible;
}
.sidebar {
  right: -11rem;
}

.overlay {
  position: absolute;
  z-index: 2147483647;
}

.absolute {
  position: absolute;
}
.relative {
  position: relative;
}

.top {
  top: 0;
}
.bottom {
  bottom: 0;
}
.left {
  left: 0;
}
.right {
  right: 0;
}
.center {
  margin: auto;
}

#remoteVideo {
  z-index: 1;
}

.flex {
  display: flex;
}
.flex.inline {
  flex-direction: row;
}
.flex.column {
  flex-direction: column;
}
.flex.justify-end {
  justify-content: flex-end;
}
.flex.align-end {
  align-items: flex-end;
}
.flex-grow {
  flex-grow: 1;
}

.flex-center {
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
