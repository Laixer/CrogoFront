<script setup lang="ts">
import { onMounted } from 'vue'
import Cargo from '@/services/cargo.js'

onMounted(() => {
  setTimeout(() => {
    const video = document.getElementById('remoteVideo')
    Cargo.connectVideoElement(video as HTMLVideoElement)
  })
})
</script>

<template>
  <video id="remoteVideo" playsinline autoplay muted></video>
</template>
