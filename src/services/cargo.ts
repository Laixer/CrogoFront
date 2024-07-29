import { initiateRTCConnection, send, connectVideoElement } from '@/services/WebRTC/index.js';
import { establishWebSocketConnection } from '@/services/websocket/index.js';
import { Engine } from './WebRTC/commands/engine';
import { Control, ControlType } from './WebRTC/commands/controls';
import { Actuator, Motion } from './WebRTC/commands/motion';
import { Echo } from './WebRTC/commands/echo';

let connectedUuid: string|null = null
let isConnected = false

/**
 * Establish a Websocket & RTC Connection to a specific Cargo unit
 */
export const connect = async function connect(uuid: string) {

  if (isConnected) {
    console.log(`Cargo - is already connected`, connectedUuid)
    throw new Error(`Cargo - is already connected - ${connectedUuid}`)
  }

  console.log("Cargo - connecting", uuid)

  // initiateRTCConnection()
  await establishWebSocketConnection({
    instanceId: uuid
  })
    .catch((err: Error) => {
      console.log("Cargo - failed to connect websocket")
      throw err
    })

  console.log("Cargo - websocket connected")

  await initiateRTCConnection()
    .catch((err: Error) => {
      console.log("Cargo - failed to connect WebRTC")
      throw err
    })

  console.log("Cargo - WebRTC connection established")
  isConnected = true
  connectedUuid = uuid
}


export const stopAllMotion = function () {

  if (!isConnected) {
    // Note: still trying, due to importance of command 
    console.error("Cargo - Trying to stop motion without active connection")
  }

  // TODO: As yet, Motion is not implemented
  send(Motion.stop_all())
}

export const resumeAllMotion = function () {

  if (!isConnected) {
    // Note: still trying, due to importance of command 
    console.error("Cargo - Trying to stop motion without active connection")
  }

  send(Motion.resume_all())
}

export const straightDrive = function (value: number) {

  if (!isConnected) {
    // Note: still trying, due to importance of command 
    console.error("Cargo - Trying to stop motion without active connection")
  }

  send(Motion.straight_drive(value))
}

// TODO: Test 
export const changeBoom = function() {

  send(Motion.change([{
    actuator: Actuator.BOOM,
    value: -15000
  }, {
    actuator: Actuator.ARM,
    value: 15000
  }]))
}

export const engineShutdown = function () {

  if (!isConnected) {
    // Note: still trying, due to importance of command 
    console.error("Cargo - Trying to stop motion without active connection")
  }

  send(Engine.shutdown())
}

export const engineRequestRPM = function (rpm: number) {

  if (!isConnected) {
    // Note: still trying, due to importance of command 
    console.error("Cargo - Trying to stop motion without active connection")
  }

  send(Engine.request_rpm(rpm))
}

export const controlLights = function (on: boolean) {

  if (!isConnected) {
    // Note: still trying, due to importance of command 
    console.error("Cargo - Trying to stop motion without active connection")
  }

  // TODO: We may want to wrap this into a ControlMethod or similar 
  send(new Control(ControlType.MACHINE_LIGHTS, on))
}

export const echo = function () {

  if (!isConnected) {
    // Note: still trying, due to importance of command 
    console.error("Cargo - Trying to stop motion without active connection")
  }

  send(new Echo(BigInt(Date.now())))
}

export default {
  connect,
  stopAllMotion,
  resumeAllMotion,
  straightDrive,
  controlLights,
  engineShutdown,
  engineRequestRPM,

  connectVideoElement,
  
  echo,


  // 
  changeBoom
}