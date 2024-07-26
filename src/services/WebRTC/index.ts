
import { sendCommand as sendWebsocketCommand } from "../websocket";
import { RTCCandidateCommand, RTCSetupCommand } from "../websocket/commands/setup";

// FUTURE: WIP: TODO
import { Frame, MessageType, type IMessage } from "./commands";
import { Control } from "./commands/controls";
import { Engine } from "./commands/engine";
import { ModuleStatus } from "./commands/status";

const configuration: RTCConfiguration = {
  bundlePolicy: "max-bundle",
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
  ],
}

let WebRTCConnection: RTCPeerConnection | null = null
let CommandChannel: RTCDataChannel | null = null

export const getWebRTCConnection = function getWebRTCConnection(): RTCPeerConnection | null {
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
  console.log("WebRTC - Creating offer")
  // WebRTCConnection.onicegatheringstatechange = onicegatheringstatechange

  WebRTCConnection.createOffer()
    .then(async (offer) => {
      if (!WebRTCConnection) {
        return // Because TS...
      }
      console.log("WebRTC - Created offer", offer)
      await WebRTCConnection.setLocalDescription(offer)

      console.log("WebRTC - local description", WebRTCConnection?.localDescription)

      // Setup RTC through the websocket connection
      sendWebsocketCommand(
        new RTCSetupCommand(offer)
      )
    })
}


// TODO: Actually send the command over the connection 
export const send = function send(message: IMessage) {
  if (!isConnected()) {
    console.error("WebRTC - not connected") // TODO: Throw Exception
  }

  const messageBuffer = message.toBytes()
  const frame = new Frame(message.messageType, messageBuffer.byteLength)
  const frameBuffer = frame.toBytes()

  // NOTE: Sending the frame header and message separately has proven unreliable in the past
  // Send the frame header
  CommandChannel?.send(frameBuffer)
  // Send the message
  CommandChannel?.send(messageBuffer)

  // ...
}

/**
 * Handle incremental connection events
 *  TODO: Handle situations after initial stable connection has been established (e.g. moving to another wifi area)
 */
const onicecandidate = function onicecandidate(event: RTCPeerConnectionIceEvent) {
  console.log("WebRTC - ice candidate", event.candidate)

  if (event.candidate === null) {
    return
  }

  // Setup RTC through the websocket connection
  sendWebsocketCommand(
    new RTCCandidateCommand(event.candidate)
  )
}

// const onicegatheringstatechange = function onicegatheringstatechange(event: Event) {
//   let connection = event.target;

//   // @ts-ignore - quick test. method is to be removed
//   if (connection.iceGatheringState === 'complete') {
//     if (WebRTCConnection === null) {
//       console.error("WebRTC - does not compute") // TS being TS
//       return 
//     }

//     if (WebRTCConnection.localDescription === null) {
//       console.error("WebRTC - A local description is required to setup a connection")
//       return
//     }
//     sendWebsocketCommand(
//       new RTCSetupCommand(WebRTCConnection?.localDescription)
//     )
//   }
// }

/**
 * On receiving a data message from the command channel
 */
const onReceiveMessage = function onReceiveMessage(event: MessageEvent) {
  // console.log(event.data)

  const frame = Frame.fromBytes(event.data)
  console.log(frame)

  switch (frame.messageType) {
    case MessageType.STATUS:
      const moduleStatus = ModuleStatus.fromBytes(event.data.slice(10))
      console.log(moduleStatus)
      break
    case MessageType.ENGINE:
      const engine = Engine.fromBytes(event.data.slice(10))
      console.log(engine)
      break
    case MessageType.CONTROL:
      const control = Control.fromBytes(event.data.slice(10))
      console.log(control)
      break
    case MessageType.MOTION:
      console.log("WebRTC - received motion message")
      break
    case MessageType.ROTATOR:
      console.log("WebRTC - received rotator message")
      break
    case MessageType.ACTOR:
      console.log("WebRTC - received actor message")
      break
    default:
      console.log("WebRTC - received unknown message")
  }
}

/**
 * Used by the Websocket RTCSetupCommand to establish the RTC connection
 */
export const setRemoteDescription = function setRemoteDescription(description: RTCSessionDescription) {

  console.log("WebRTC - setting remote description")

  const WebRTC = getWebRTCConnection()

  if (WebRTC === null) {
    console.error("WebRTC - Missing WebRTC instance while trying to set a remote description")
    return
  }

  WebRTC.setRemoteDescription(description)
}
