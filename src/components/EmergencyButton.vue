<script setup lang="ts">

import Cargo from '@/services/cargo.js';
import Button from './Button.vue'

const handleEmergencyStop = function handleEmergencyStop() {
  Cargo.engineShutdown()
}
</script>

<template>
  <Button warning @click="handleEmergencyStop">
    STOP
  </Button>
</template>