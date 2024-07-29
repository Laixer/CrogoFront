
import { sendCommand as sendWebsocketCommand } from "../websocket";
import { RTCCandidateCommand, RTCSetupCommand } from "../websocket/commands/setup";

// FUTURE: WIP: TODO
import { Frame, GLONAX_PROTOCOL_HEADER_SIZE, MessageType, type IMessage } from "./commands";
import { Control } from "./commands/controls";
import { Echo } from "./commands/echo";
import { Engine } from "./commands/engine";
import { Instance } from "./commands/instance";
import { Motion } from "./commands/motion";
import { ModuleStatus } from "./commands/status";

const configuration: RTCConfiguration = {
  bundlePolicy: "max-bundle",
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
  ],
}

let WebRTCConnection: RTCPeerConnection | null = null
let CommandChannel: RTCDataChannel | null = null
let VideoStream: MediaStream | null = null


export const getWebRTCConnection = function getWebRTCConnection(): RTCPeerConnection | null {
  return WebRTCConnection
}

export const isConnected = function isConnected(): boolean {
  return WebRTCConnection !== null && WebRTCConnection?.connectionState === 'connected'
}

export const initiateRTCConnection = function initiateRTCConnection() {
  return new Promise((resolve, reject) => {
    try {
      WebRTCConnection = new RTCPeerConnection(configuration);

      // Note: Without specifying at least 1 transciever / data channel, 
      //       trying to establish a connection will throw an error

      WebRTCConnection.addTransceiver('video', { direction: 'recvonly' })
      WebRTCConnection.ontrack = (event: RTCTrackEvent) => {
        if (event.streams.length) {
          VideoStream = event.streams[0]
        } else {
          console.error("WebRTC video - missing stream data")
        }
      } 
    
      // create the command channel
      CommandChannel = WebRTCConnection.createDataChannel("command")
      CommandChannel.onmessage = onReceiveMessage
    
      // Resolve the promise when the connection is established
      WebRTCConnection.onconnectionstatechange = (event: Event) => {
        console.log("WebRTC - connection state change", event)

        if (isConnected()) {
          
          // Remove this event handler. We only want to resolve once
          WebRTCConnection && (WebRTCConnection.onconnectionstatechange = null)
          
          resolve(true)
        }
      }

      // Establishing the connection
      WebRTCConnection.onicecandidate = onicecandidate

    
      console.log("WebRTC - Creating offer")
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
    } catch(err) {
      console.log("WebRTC - failure while connecting", err)
      reject(err)
    }
  })  
}

export const send = function send(message: IMessage) {
  if (!isConnected()) {
    console.error("WebRTC - not connected") // TODO: Throw Exception
  }

  const messageBuffer = message.toBytes()
  const frame = new Frame(message.messageType, messageBuffer.byteLength)
  const frameBuffer = frame.toBytes()

  /**
   * Combine the 2 buffers into 1 buffer
   *  Sending them separate will cause processing issues at the receiving end
   */
  const commandBuffer = new ArrayBuffer(GLONAX_PROTOCOL_HEADER_SIZE + messageBuffer.byteLength)
  const combinedBuffer = new Uint8Array(commandBuffer)
  combinedBuffer.set(new Uint8Array(frameBuffer), 0)
  combinedBuffer.set(new Uint8Array(messageBuffer), GLONAX_PROTOCOL_HEADER_SIZE)

  CommandChannel?.send(commandBuffer)
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

/**
 * On receiving a data message from the command channel
 */
const onReceiveMessage = function onReceiveMessage(event: MessageEvent) {
  // console.log(event.data)

  // TODO: Check that we have received a full frame AND its payload. This essentially means the array buffer is at least 10+1 bytes long

  const frame = Frame.fromBytes(event.data)
  console.log("WebRTC - frame", frame)

  switch (frame.messageType) {
    case MessageType.ECHO:
      const echo = Echo.fromBytes(event.data.slice(10)) // TODO: This is temporary, frame/payload boundary could change
      console.log(echo)
      break
    case MessageType.STATUS:
      const moduleStatus = ModuleStatus.fromBytes(event.data.slice(10)) // TODO: This is temporary, frame/payload boundary could change
      console.log(moduleStatus)
      break
    case MessageType.ENGINE:
      const engine = Engine.fromBytes(event.data.slice(10)) // TODO: This is temporary, frame/payload boundary could change
      console.log(engine)
      break
    case MessageType.CONTROL:
      const control = Control.fromBytes(event.data.slice(10)) // TODO: This is temporary, frame/payload boundary could change
      console.log(control)
      break
    case MessageType.MOTION:
      const motion = Motion.fromBytes(event.data.slice(10)) // TODO: This is temporary, frame/payload boundary could change
      console.log(motion)
      break
    case MessageType.INSTANCE:
      const instance = Instance.fromBytes(event.data.slice(10)) // TODO: This is temporary, frame/payload boundary could change
      console.log(instance)
      break
    case MessageType.ROTATOR:
      // TODO: Implement... 3d vector - ignore every 50ms hide message
      console.log("WebRTC - received rotator message")
      break
    case MessageType.ACTOR:
      // TODO: Implement... - 3d presentation
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
  try {
    console.log("WebRTC - setting remote description")

    const WebRTC = getWebRTCConnection()
    if (WebRTC === null) {
      console.error("WebRTC - Missing WebRTC instance while trying to set a remote description")

      throw new Error("WebRTC - Missing WebRTC instance while trying to set a remote description")
    }

    WebRTC.setRemoteDescription(description)
  } catch(err) {
    console.log("WebRTC - failed to set remote connection")
    throw err
  }
}


export const connectVideoElement = (video: HTMLVideoElement) => {
  if (VideoStream) {
    video.srcObject = VideoStream
  }
}