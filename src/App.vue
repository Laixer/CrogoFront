<script setup lang="ts">
import Cargo from '@/services/cargo.js';
import { RouterView } from 'vue-router'

// Woody
const instanceId = "d6d1a2db-52b9-4abb-8bea-f2d0537432e2"

// Yorick test
// const instanceId = "78adc7fc-6f60-4fc7-81ed-91396892f4a1"

// Volvo
// const instanceId = "38df5a6a-0b90-45f6-89eb-b831a3db555d"

Cargo.connect(instanceId)

setTimeout(() => {
  console.log("-------------------------------------------------------------------------------------------------")
  Cargo.resumeAllMotion()

}, 5 * 1000)

</script>

<template>
  <RouterView />
</template>
