<script setup lang="ts">
defineProps({
  primary: { type: Boolean },
  secondary: { type: Boolean },
  warning: { type: Boolean },
  small: { type: Boolean },
  disabled: { type: Boolean }
})
</script>

<template>
  <div class="button" :class="{ primary, secondary, warning, small, disabled }">
    <slot />
  </div>
</template>
<style>
.button {
  background-color: #04aa6d;
  border: none;
  border-radius: 0.4rem;
  color: white;
  padding: 1rem 2rem;
  text-align: center;
  text-decoration: none;
  display: inline-block;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  user-select: none;
}
.button.small {
  padding: 0.2rem 0.5rem;
}
.button:hover {
  background-color: #038857;
}
.button.primary {
  background-color: #04aa6d;
}
.button.primary:hover {
  background-color: #038857;
}
.button.secondary {
  background-color: #e69138;
}
.button.secondary:hover {
  background-color: #cf8232;
}
.button.warning {
  background-color: #cc3300;
}
.button.warning:hover {
  background-color: #992600;
}
.button.disabled,
.button.disabled:hover {
  cursor: not-allowed;
  background-color: gray;
}
</style>
