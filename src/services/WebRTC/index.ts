
import { sendCommand as sendWebsocketCommand } from "../websocket";
import { RTCCandidateCommand, RTCSetupCommand } from "../websocket/commands/setup";
import type { ICommand } from "./commands";

const configuration: RTCConfiguration = {
  bundlePolicy: "max-bundle", 
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
  ],
}

let WebRTCConnection: RTCPeerConnection|null = null
let CommandChannel: RTCDataChannel|null = null

export const getWebRTCConnection = function getWebRTCConnection(): RTCPeerConnection|null {
  return WebRTCConnection
}

export const isConnected = function isConnected(): boolean {
  return WebRTCConnection !== null && WebRTCConnection?.connectionState === 'connected'
}

export const initiateRTCConnection = function initiateRTCConnection() {
  WebRTCConnection = new RTCPeerConnection(configuration);

  // Note: Without specifying at least 1 transciever, trying to establish a connection will throw an error
  // TODO: Leverage video.ts
  WebRTCConnection.addTransceiver('video', { direction: 'recvonly' })

  // create the command channel
  CommandChannel = WebRTCConnection.createDataChannel("command")
  CommandChannel.onmessage = onReceiveMessage

  // Establishing the connection
  WebRTCConnection.onicecandidate = onicecandidate
  WebRTCConnection.createOffer()
    .then(offer => {
      WebRTCConnection && WebRTCConnection.setLocalDescription(offer)
      
      // Setup RTC through the websocket connection
      sendWebsocketCommand(
        new RTCSetupCommand(offer)
      )
    })
}


// TODO: Actually send the command over the connection 
export const send = function send(command: ICommand) {
  if (! isConnected()) {
    console.error("WebRTC - not connected") // TODO: Throw Exception
  }
  console.log(command)

  // ...
}

/**
 * Handle incremental connection events
 *  TODO: Handle situations after initial stable connection has been established (e.g. moving to another wifi area)
 */
const onicecandidate = function onicecandidate(event: RTCPeerConnectionIceEvent) {
  if (event.candidate === null) {
    return
  }

  // Setup RTC through the websocket connection
  sendWebsocketCommand(
    new RTCCandidateCommand(event.candidate)
  )
}

/**
 * On receiving a data message from the command channel
 */
const onReceiveMessage = function onReceiveMessage(event: MessageEvent) {
  console.log(event)
}

/**
 * Used by the Websocket RTCSetupCommand to establish the RTC connection
 */
export const setRemoteDescription = function setRemoteDescription(description: RTCSessionDescription) {
  const WebRTC = getWebRTCConnection()

  if (WebRTC === null) {
    console.error("WebRTC - Missing WebRTC instance while trying to set a remote description")
    return
  }

  WebRTC.setRemoteDescription(description)
}
