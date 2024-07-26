import { initiateRTCConnection, send } from '@/services/WebRTC/index.js';
import { establishWebSocketConnection } from '@/services/websocket/index.js';
import { Engine } from './WebRTC/commands/engine';

let isConnected = false

/**
 * Establish a Websocket & RTC Connection to a specific Cargo unit
 *  TODO: Restrict to only 1 connected unit allowed
 */
export const connect = function connect(uuid: string) {

  console.log("Cargo - connecting", uuid)

  // initiateRTCConnection()
  establishWebSocketConnection({
    instanceId: uuid,
    onOpen: initiateRTCConnection
  })

  // TODO: Verify connections 
  // console.log("Cargo - connected", uuid)

  // TODO: not yet true at this point
  isConnected = true
}


export const stopAllMotion = function () {

  if (!isConnected) {
    // Note: still trying, due to importance of command 
    console.error("Cargo - Trying to stop motion without active connection")
  }

  // TODO: As yet, the command is not implemented
  // send(new MotionStopAllCommand())
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

export default {
  connect,
  stopAllMotion
}