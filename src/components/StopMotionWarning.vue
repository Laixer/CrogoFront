<script setup lang="ts">
import { ref } from 'vue'
import Warning from '@/components/Warning.vue'
import Cargo from '@/services/cargo.js'
import { MessageType } from '@/services/WebRTC/commands/index'
import { Motion, MotionType } from '@/services/WebRTC/commands/motion'

const show = ref(false)

Cargo.subscribe(MessageType.MOTION, (event: Motion) => {
  show.value = event.type === MotionType.STOP_ALL
})
</script>

<template>
  <Warning v-if="show" label="MOTION LOCKED" />
</template>
