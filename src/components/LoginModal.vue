<script setup lang="ts">
import { computed, onBeforeUnmount, ref, type Ref } from 'vue'
import Button from '@/components/Button.vue'
import Cargo from '@/services/cargo.js'
import { PubSubService } from '@/services/PubSubService.js'
import { RTCSetupErrorEvent } from '@/services/websocket/commands/setup.js'

const selectedUuid: Ref<string | undefined> = ref()
const selectedResolution: Ref<string> = ref('1280x720')
const password: Ref<string | undefined> = ref()

const selectedUnitName = computed(() => {
  if (selectedUuid.value) {
    return cargoUnits.find((unit) => unit.uuid === selectedUuid.value)?.name || ''
  }
  return ''
})

const sending: Ref<boolean> = ref(false)
const feedback: Ref<string | undefined> = ref()

const cargoUnits = [
  {
    name: 'Woody',
    uuid: 'd6d1a2db-52b9-4abb-8bea-f2d0537432e2',
    shortUuid: ''
  },
  {
    name: 'Gustav',
    uuid: '38df5a6a-0b90-45f6-89eb-b831a3db555d',
    shortUuid: ''
  },
  {
    name: "Yorick's test rig",
    uuid: '78adc7fc-6f60-4fc7-81ed-91396892f4a1'
  }
].map((unit) => {
  unit.shortUuid = unit.uuid.split('-')[0]
  return unit
})

const disableSizeSelection = true // TODO: To be implemented when backend is ready
const videoSizes = ['1920x1080', '1280x720', '640x480', '320x240']

const isDisabled = computed(() => {
  return hasInvalidInput()
})

const hasInvalidInput = function () {
  return (
    typeof selectedUuid.value !== 'string' ||
    typeof password.value !== 'string' ||
    password.value?.length === 0
  )
}

const handleClick = async function handleClick() {
  if (hasInvalidInput()) {
    feedback.value = 'Invalid input'
    return
  }
  if (sending.value) {
    feedback.value = 'Already busy connecting'
    return
  }
  sending.value = true

  // Making TS shut up, because it doesn't understand hasInvalidInput
  if (selectedUuid.value && password.value && selectedResolution.value) {
    const passwordValue = password.value + ''

    // Clear the password
    password.value = ''

    await Cargo.connect(selectedUuid.value, passwordValue, selectedResolution.value)
  }

  sending.value = false
}

const handleSetupError = function handleError(event: RTCSetupErrorEvent) {
  feedback.value = event.message
  sending.value = false
}
const handleTimeoutError = function handleTimeoutError() {
  sending.value = false
  feedback.value = 'Connection timeout'
}
const handleWebsocketError = function handleWebsocketError() {
  sending.value = false
  Cargo.cancelConnection()
  feedback.value = 'Websocket error'
}

const urlParams = new URLSearchParams(window.location.search)
const instanceId = urlParams.get('id')

if (instanceId && cargoUnits.find((unit) => unit.uuid === instanceId)) {
  selectedUuid.value = instanceId
}

const unsubscribeSetupError = PubSubService.subscribe('error.rtc.setup', handleSetupError)
const unsubscribeSetupTimeoutError = PubSubService.subscribe('error.connect', handleTimeoutError)
const unsubscribeWebsocketError = PubSubService.subscribe('error.websocket', handleWebsocketError)

onBeforeUnmount(() => {
  if (unsubscribeSetupError) {
    unsubscribeSetupError()
  }
  if (unsubscribeSetupTimeoutError) {
    unsubscribeSetupTimeoutError()
  }
  if (unsubscribeWebsocketError) {
    unsubscribeWebsocketError()
  }
})
</script>

<template>
  <form
    class="LoginModal flex column top left right bottom center p-2"
    @submit.prevent="handleClick"
  >
    <p class="Busy" v-if="sending">Bezig met het verbinding met {{ selectedUnitName }}...</p>
    <p class="Feedback mb-1" v-if="feedback">{{ feedback }}</p>
    <template v-if="!sending">
      <label for="unit"> Selecteer een kraan </label>
      <select :disabled="sending" id="unit" name="unit" v-model="selectedUuid">
        <option v-for="unit in cargoUnits" :key="unit.shortUuid" :value="unit.uuid">
          {{ unit.name }} ({{ unit.shortUuid }})
        </option>
      </select>

      <label class="mt-1" for="resolution">Selecteer een resolutie</label>
      <select
        :disabled="disableSizeSelection || sending"
        id="resolution"
        name="resolution"
        v-model="selectedResolution"
      >
        <option v-for="size of videoSizes" :key="size" :value="size">{{ size }}</option>
      </select>

      <label class="mt-1" for="password">Wachtwoord</label>
      <input :disabled="sending" id="password" type="password" v-model="password" />

      <Button class="mt-1" small primary :disabled="isDisabled || sending" @click="handleClick"
        >Verbinding maken</Button
      >
    </template>
  </form>
</template>

<style>
.LoginModal {
  width: 400px;
  background-color: white;
  color: #032836;
  border-radius: 4px;
}
.Feedback {
  color: red;
}
</style>
