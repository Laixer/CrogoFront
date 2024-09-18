<script setup lang="ts">
import Cargo from '@/services/cargo.js'
import Button from './Button.vue'

const handleDisconnect = function handleDisconnect() {
  Cargo.disconnect()
}
</script>

<template>
  <Button class="DisconnectBtn" small secondary @click="handleDisconnect"> disconnect </Button>
</template>

<style>
.DisconnectBtn {
  width: 9rem;
  line-height: 1.25;
}
</style>
