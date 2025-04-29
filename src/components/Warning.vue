<script setup lang="ts">
defineProps({
  label: { type: String },
  muted: { type: Boolean, default: true }
})
</script>

<template>
  <div class="Warning" :class="{ 'Warning--muted': muted }">
    {{ label }}
  </div>
</template>

<style>
.Warning {
  border: #cc330080 3px solid;
  color: white;
  font-size: 2rem;
  font-weight: bold;
  padding: 1rem 4rem;
  background-color: #cc330050;
}

.Warning--muted {
  border: #cc330080 2px solid;
  font-size: 1rem;
  padding: 0.15rem 2rem;
}
</style>
