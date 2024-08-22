
import { disconnect } from "../cargo";
import Debugger from "../Debugger";
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
let SignalChannel: RTCDataChannel | null = null
let VideoStream: MediaStream | null = null


export const getWebRTCConnection = function getWebRTCConnection(): RTCPeerConnection | null {
  return WebRTCConnection
}

export const isConnected = function isConnected(): boolean {
  return WebRTCConnection !== null && WebRTCConnection?.connectionState === 'connected'
}

export const isFailed = function isFailed(): boolean {
  return WebRTCConnection !== null && WebRTCConnection?.connectionState === 'failed'
}

export const initiateRTCConnection = function initiateRTCConnection() {
  return new Promise<RTCPeerConnection>((resolve, reject) => {
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
      // Command channel is for 2 way communication
      CommandChannel = WebRTCConnection.createDataChannel("command")
      CommandChannel.onmessage = onReceiveMessage

      // TODO: separate signal on receive message
      // Signal channel is only for receiving messages
      SignalChannel = WebRTCConnection.createDataChannel("signal")
      SignalChannel.onmessage = onReceiveMessage
    
      // Resolve the promise when the connection is established
      WebRTCConnection.onconnectionstatechange = (event: Event) => {
        console.log("WebRTC - connection state change", event)

        if (isConnected()) {
          
          // Remove this event handler. We only want to resolve once
          WebRTCConnection && (WebRTCConnection.onconnectionstatechange = null)
          
          resolve(WebRTCConnection as RTCPeerConnection)
        }

        if (isFailed()) {
          // TODO: Show message ?
          // TODO: Auto retry ? After delay of x seconds ? 
          console.error("WebRT - Failed connection")

          // Remove this event handler. We only want to resolve once
          WebRTCConnection && (WebRTCConnection.onconnectionstatechange = null)
          reject("connection failed")
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

  // signals that there are no more candidates to process
  if (event.candidate === null) {
    return
  }

  // Setup RTC through the websocket connection
  sendWebsocketCommand(
    new RTCCandidateCommand(event.candidate)
  )
}


const lastReceivedMessagesByType: Record<MessageType, MessageEvent|undefined> = {
  [MessageType.ERROR]: undefined,
  [MessageType.ECHO]: undefined,
  [MessageType.SESSION]: undefined,
  [MessageType.SHUTDOWN]: undefined,
  [MessageType.REQUEST]: undefined,
  [MessageType.INSTANCE]: undefined,
  [MessageType.STATUS]: undefined,
  [MessageType.MOTION]: undefined,
  [MessageType.SIGNAL]: undefined,
  [MessageType.ACTOR]: undefined,
  [MessageType.VMS]: undefined,
  [MessageType.GNSS]: undefined,
  [MessageType.ENGINE]: undefined,
  [MessageType.TARGET]: undefined,
  [MessageType.CONTROL]: undefined,
  [MessageType.ROTATOR]: undefined
}

const ignoreReceivedMessages = (type: MessageType, event: MessageEvent ) => {

  if (lastReceivedMessagesByType[type] && lastReceivedMessagesByType[type] === event) {
    return true
  }

  lastReceivedMessagesByType[type] = event
  return false
}

/**
 * On receiving a data message from the command channel
 */
const onReceiveMessage = function onReceiveMessage(event: MessageEvent) {
  // console.log(event.data)

  // TODO: Check that we have received a full frame AND its payload. This essentially means the array buffer is at least 10+1 bytes long

  const frame = Frame.fromBytes(event.data)

  Debugger.log("WebRTC - frame", frame)

  // console.log("WebRTC - frame", frame)
  if (ignoreReceivedMessages(frame.messageType, event)) {
    console.log("Ignore")
    return 
  }

  switch (frame.messageType) {
    case MessageType.ECHO:
      console.log("ECHO")
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
      // TODO: Verify instance id
      // TODO: Verify version 
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
export const setRemoteDescription = async function setRemoteDescription(description: RTCSessionDescription) {
  try {
    console.log("WebRTC - setting remote description")

    const WebRTC = getWebRTCConnection()
    if (WebRTC === null) {
      console.error("WebRTC - Missing WebRTC instance while trying to set a remote description")

      throw new Error("WebRTC - Missing WebRTC instance while trying to set a remote description")
    }

    await WebRTC.setRemoteDescription(description)
    
  } catch(err) {
    console.log("WebRTC - failed to set remote connection", description)

    disconnect()
    throw err
  }
}


export const connectVideoElement = (video: HTMLVideoElement) => {
  if (VideoStream) {
    video.srcObject = VideoStream
  }
}