import {
  initiateRTCConnection,
  send,
  connectVideoElement,
  closeConnection as closeWebRTCConnection,
  ConnectionStateEvent
} from '@/services/WebRTC/index.js'
import {
  establishWebSocketConnection,
  isWebSocketConnectionAvailable,
  close as closeWebsocketConnection,
  sendCommand
} from '@/services/websocket/index.js'
import { Engine } from './WebRTC/commands/engine'
import { Control, ControlType } from './WebRTC/commands/controls'
import { Actuator, Motion } from './WebRTC/commands/motion'
import { Echo } from './WebRTC/commands/echo'
import { RebootCommand } from './websocket/commands/state'
import { connectController as setupGamepadController } from '@/services/Gamepad/index.js'
import { PubSubEvent, PubSubService } from '@/services/PubSubService'

let connectedUuid: string | null = null
let _isConnected = false

let initiated = false

let connectionTimeout: ReturnType<typeof setTimeout>

/**
 * TODO: States to keep track of
 *
 *  - websocket
 *  - webrtc
 *   - connection
 *   - signal data channel
 *   - command data channel
 *   - video channel
 *
 *  - cargo
 *   - init
 *   - connect
 *
 *  - gamepad
 */

export class ConnectionErrorEvent extends PubSubEvent {
  constructor() {
    super('ConnectionErrorEvent')
  }
}

export const init = async function init() {
  // TODO: state: 'new', 'initiating', 'initiated', 'connecting', 'connected', 'disconnected'
  if (initiated) {
    console.log(`Cargo - already initiated to ${connectedUuid}`)
    return
  }

  console.log('Cargo - setup gamepad')
  // Connect the GamePad controller
  setupGamepadController()

  PubSubService.subscribe('connection.connectionStateChange', _registerDisconnect)
  PubSubService.subscribe('connection.channelStateChange', _registerDisconnect)

  initiated = true
}

/**
 * Establish a RTC Connection to a specific Cargo unit
 */
export const connect = async function connect(uuid: string, password: string, resolution: string) {
  if (_isConnected) {
    console.log(`Cargo - is already connected`, connectedUuid)
    throw new Error(`Cargo - is already connected - ${connectedUuid}`)
  }
  if (initiated !== true) {
    throw new Error(`Cargo - Need to initiate first.`)
  }

  cancelConnection()

  // Allow 10 seconds for creating a connection
  connectionTimeout = setTimeout(() => {
    if (!_isConnected) {
      closeWebRTCConnection()

      PubSubService.emit('error.connect', new ConnectionErrorEvent())
    }
  }, 10000)

  if (isWebSocketConnectionAvailable()) {
    console.log('Cargo - cleaning up previous websocket connection')
    closeWebsocketConnection()
  }

  console.log('Cargo - connecting websocket')
  await establishWebSocketConnection({
    instanceId: uuid
  }).catch((err: Error) => {
    console.log('Cargo - failed to connect websocket')
    throw err
  })
  console.log('Cargo - websocket connected')

  connectedUuid = uuid
  console.log(`Cargo - init ${connectedUuid}`)

  console.log('Cargo - connecting WebRTC', connectedUuid)

  await initiateRTCConnection(password, resolution).catch((err: Error) => {
    console.log('Cargo - failed to connect WebRTC')
    throw err
  })
  console.log('Cargo - WebRTC connection established')

  clearTimeout(connectionTimeout)

  _isConnected = true
}

export const cancelConnection = () => {
  if (connectionTimeout) {
    clearTimeout(connectionTimeout)
    closeWebRTCConnection()
    closeWebsocketConnection()
    _isConnected = false
  }
}

const _registerDisconnect = (event: ConnectionStateEvent) => {
  if (event.state && ['closed', 'closing', 'disconnected', 'failed'].includes(event.state)) {
    closeWebsocketConnection()
    _isConnected = false
  }
}

export const isConnected = function (): boolean {
  return !!_isConnected
}

// TODO: Test
export const changeBoom = function () {
  send(
    Motion.change([
      {
        actuator: Actuator.BOOM,
        value: -15000
      },
      {
        actuator: Actuator.ARM,
        value: 15000
      }
    ])
  )
}

export const engineShutdown = function () {
  if (!_isConnected) {
    // Note: still trying, due to importance of command
    console.error('Cargo - Trying to shut down the engine without active connection')
  }

  send(Engine.shutdown())
}

export const engineRequestRPM = function (rpm: number) {
  if (!_isConnected) {
    // Note: still trying, due to importance of command
    console.error('Cargo - Trying to change rpm without active connection')
    return
  }

  send(Engine.request_rpm(rpm))
}

export const controlLights = function (on: boolean) {
  if (!_isConnected) {
    // Note: still trying, due to importance of command
    console.error('Cargo - Trying to control lights without active connection')
    return
  }

  // TODO: We may want to wrap this into a ControlMethod or similar
  send(new Control(ControlType.MACHINE_LIGHTS, on))
}

export const echo = function () {
  if (!_isConnected) {
    // Note: still trying, due to importance of command
    console.error('Cargo - Trying to echo without active connection')
    return
  }

  send(new Echo(BigInt(Date.now())))
}

export const reboot = function () {
  console.log('sending reboot command')
  sendCommand(new RebootCommand())
}

export const disconnect = function disconnect() {
  if (!_isConnected) {
    console.log('No connection to disconnect')
    // return always send disconnect command
  }
  console.log('sending disconnect RTC command')
  // sendCommand(new DisconnectRTCCommand())
  closeWebRTCConnection()
}

export const stopAllMotion = function () {
  console.log('Stop all motion')

  if (!_isConnected) {
    // Note: still trying, due to importance of command
    console.error('Cargo - Trying to stop motion without active connection')
  }

  send(Motion.stop_all())
}

export const resumeAllMotion = function () {
  if (!_isConnected) {
    // Note: still trying, due to importance of command
    console.error('Cargo - Trying to resume motion without active connection')
    return
  }

  send(Motion.resume_all())
}

export const straightDrive = function (value: number) {
  const actuatorValue = Math.round(value)
  console.log('straightDrive', actuatorValue)

  if (!_isConnected) {
    // Note: still trying, due to importance of command
    console.error('Cargo - Trying to straigth drive without active connection')
    return
  }

  send(Motion.straight_drive(actuatorValue))
}

export const motionChange = function (actuator: Actuator, value: number) {
  const actuatorValue = Math.round(value)
  console.log('motionChange', actuator, actuatorValue)

  if (!_isConnected) {
    console.error('Cargo - Trying to change motion without active connection')
    return
  }

  send(
    Motion.change([
      {
        actuator,
        value: actuatorValue
      }
    ])
  )
}

export default {
  init,
  connect,
  cancelConnection,
  isConnected,
  stopAllMotion,
  resumeAllMotion,
  motionChange,
  straightDrive,
  controlLights,
  engineShutdown,
  engineRequestRPM,

  connectVideoElement,

  echo,
  reboot,
  disconnect,

  // Subscribe to (WebRTC) events
  PubSubService,

  //
  changeBoom
}
