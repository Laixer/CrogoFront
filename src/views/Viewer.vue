<script setup lang="ts">
import { onMounted } from 'vue';
import Cargo from '@/services/cargo.js';
import { XBOXControls } from '@/services/XBOXControls'

import Ping from '@/components/Ping.vue'
import RPM from '@/components/RPM.vue'
import EmergencyButton from '@/components/EmergencyButton.vue'
import StopMotionButton from '@/components/StopMotionButton.vue'
import DisconnectButton from '@/components/DisconnectButton.vue'
import StopMotionWarning from '@/components/StopMotionWarning.vue'
import ConnectionWarning from '@/components/ConnectionWarning.vue'

const urlParams = new URLSearchParams(window.location.search)
const instanceId = urlParams.get('id')
console.log("Viewer - instance_id from url", instanceId)

const enableOverlay = false

new XBOXControls()

// Woody
// const instanceId = "d6d1a2db-52b9-4abb-8bea-f2d0537432e2"

// Yorick test
// const instanceId = "78adc7fc-6f60-4fc7-81ed-91396892f4a1"

// Volvo
// const instanceId = "38df5a6a-0b90-45f6-89eb-b831a3db555d"

try {
  if (instanceId) {
    // await Cargo.connect(instanceId)
  } else {
    throw new Error("Missing instanceId")
  }
} catch (err) {
  console.log("ERR0R")
  console.log(err)
}


setTimeout(() => {

  // Cargo.reboot()
  // Cargo.echo()
  // Cargo.engineRequestRPM(800)
  // Cargo.disconnect()

}, 2000)



onMounted(() => {
  const video = document.getElementById('remoteVideo')
  Cargo.connectVideoElement(video as HTMLVideoElement)
})


</script>

<template>
  <div class="videoContainer">
    <video id="remoteVideo" playsinline autoplay muted></video>

    <div class="overlay flex-center top bottom left right">
      <ConnectionWarning />
      <StopMotionWarning />
    </div>
    
    <template v-if="enableOverlay">
      <div class="overlay top right flex column justify-end align-end mt-1 mr-1">
        <div class="flex inline">
          <Ping class="mr-1" />
          <RPM />
        </div>
        <div 
          class="flex column justify-end align-end mt-1" 
          style="color: black">
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

        <EmergencyButton class="absolute bottom right mx-1 mb-1 left right" />
      </div>
    </template>
  </div>
</template>

<style>
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
  left: 0
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
  justify-content: flex-end
}
.flex.align-end {
  align-items: flex-end
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