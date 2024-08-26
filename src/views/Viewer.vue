<script setup lang="ts">
import Cargo from '@/services/cargo.js';
import { onMounted } from 'vue';

import Ping from '@/components/Ping.vue'
import RPM from '@/components/RPM.vue'
import EmergencyButton from '@/components/EmergencyButton.vue'
import StopMotionButton from '@/components/StopMotionButton.vue'
import StopMotionWarning from '@/components/StopMotionWarning.vue'

const urlParams = new URLSearchParams(window.location.search)
const instanceId = urlParams.get('id')
console.log("Viewer - instance_id from url", instanceId)

// Woody
// const instanceId = "d6d1a2db-52b9-4abb-8bea-f2d0537432e2"

// Yorick test
// const instanceId = "78adc7fc-6f60-4fc7-81ed-91396892f4a1"

// Volvo
// const instanceId = "38df5a6a-0b90-45f6-89eb-b831a3db555d"

try {
  if (instanceId) {
    await Cargo.connect(instanceId)
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

}, 2000)



onMounted(() => {
  const video = document.getElementById('remoteVideo')
  Cargo.connectVideoElement(video as HTMLVideoElement)
})


</script>

<template>
  <div class="videoContainer">
    <video id="remoteVideo" playsinline autoplay muted></video>

    <div class="overlay center top bottom left right">
      <StopMotionWarning />
    </div>

    <div class="overlay top right flex column justify-end align-end mt-1 mr-1">
      <div class="flex inline">
        <Ping />
        <RPM />
      </div>
      <div 
        class="flex column justify-end align-end mt-1" 
        style="color: black">
        <StopMotionButton />
      </div>
    </div>

    <div class="overlay bottom right mb-1 mr-1">
      <EmergencyButton />
    </div>
    

  </div>
</template>

<style>
.videoContainer {
  position: relative;
  display: flex;
}

.overlay {
  position: absolute;
  z-index: 2147483647;
}
.center {
  display: flex;
  justify-content: center;
  align-items: center;
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


</style>