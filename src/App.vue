<script setup lang="ts">
import Cargo from '@/services/cargo.js';
import { RouterView } from 'vue-router'


const instanceId = "d6d1a2db-52b9-4abb-8bea-f2d0537432e2"

Cargo.connect(instanceId)

setTimeout(() => {
  Cargo.stopAllMotion()
}, 30 * 1000)

</script>

<template>
  <RouterView />
</template>
