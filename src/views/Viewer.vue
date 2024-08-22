<script setup lang="ts">
import Cargo from '@/services/cargo.js';
import { onMounted } from 'vue';

const urlParams = new URLSearchParams(window.location.search)
const instance_id = urlParams.get('id')
console.log("Viewer - instance_id from url", instance_id)

// Woody
// const instanceId = "d6d1a2db-52b9-4abb-8bea-f2d0537432e2"

// Yorick test
// const instanceId = "78adc7fc-6f60-4fc7-81ed-91396892f4a1"

// Volvo
// const instanceId = "38df5a6a-0b90-45f6-89eb-b831a3db555d"

try {
  const instanceId = instance_id
  await Cargo.connect(instanceId)
} catch (err) {
  console.log("ERR0R")
  console.log(err)
}

console.log("test")
setTimeout(() => {

  Cargo.echo()
  // Cargo.disconnect()

}, 2000)




onMounted(() => {
  const video = document.getElementById('remoteVideo')
  Cargo.connectVideoElement(video as HTMLVideoElement)
})


</script>

<template>

  <video id="remoteVideo" playsinline autoplay muted></video>

  <div id="overlay">This is HTML overlay on top of the video! </div>

</template>

<style>
#overlay {
  position: absolute;
  top: 100px;
  color: #FFF;
  text-align: center;
  font-size: 20px;
  background-color: rgba(221, 221, 221, 0.3);
  width: 640px;
  padding: 10px 0;
  z-index: 2147483647;
}

#remoteVideo {
  z-index: 1;
}
</style>