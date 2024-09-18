<script setup lang="ts">
import { computed, type ComputedRef } from 'vue'

const props = defineProps({
  bars: { type: Number, required: true }
})

const signalStrength: ComputedRef<'good' | 'bad' | 'ok' | 'none'> = computed(() => {
  if (props.bars === 5 || props.bars === 4) {
    return 'good'
  }
  if (props.bars === 3) {
    return 'ok'
  }
  if (props.bars === 2 || props.bars === 1) {
    return 'bad'
  }
  return 'none'
})

const barsClass: ComputedRef<
  'five-bars' | 'four-bars' | 'three-bars' | 'two-bars' | 'one-bar' | 'no-bars'
> = computed(() => {
  switch (props.bars) {
    case 5:
      return 'five-bars'
    case 4:
      return 'four-bars'
    case 3:
      return 'three-bars'
    case 2:
      return 'two-bars'
    case 1:
      return 'one-bar'
  }
  return 'no-bars'
})
</script>
<template>
  <div class="signal-bars" :class="`${signalStrength} ${barsClass}`">
    <div class="first-bar bar"></div>
    <div class="second-bar bar"></div>
    <div class="third-bar bar"></div>
    <div class="fourth-bar bar"></div>
    <div class="fifth-bar bar"></div>
  </div>
</template>

<style>
.signal-bars {
  display: inline-block;
  height: 50px;
  width: 50px;
}

.signal-bars .bar {
  width: 18%;
  margin-left: 2%;
  min-height: 20%;
  display: inline-block;
}

.signal-bars .bar.first-bar {
  height: 20%;
}
.signal-bars .bar.second-bar {
  height: 40%;
}
.signal-bars .bar.third-bar {
  height: 60%;
}
.signal-bars .bar.fourth-bar {
  height: 80%;
}
.signal-bars .bar.fifth-bar {
  height: 99%;
}

.good .bar {
  background-color: #16a085;
  border: thin solid darken(#16a085, 7%);
}
.bad .bar {
  background-color: #e74c3c;
  border: thin solid darken(#e74c3c, 20%);
}
.ok .bar {
  background-color: #f1c40f;
  border: thin solid darken(#f1c40f, 7%);
}

.no-bars div,
.four-bars .bar.fifth-bar,
.three-bars .bar.fifth-bar,
.three-bars .bar.fourth-bar,
.one-bar .bar:not(.first-bar),
.two-bars .bar:not(.first-bar):not(.second-bar) {
  background-color: #fafafa;
  border: thin solid #f3f3f3;
}
</style>
