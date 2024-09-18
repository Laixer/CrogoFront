<script setup lang="ts">
defineProps({
  label: { type: String }
})
</script>

<template>
  <div class="Warning">
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
</style>
