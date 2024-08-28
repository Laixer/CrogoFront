
import { disconnect } from "../cargo";
// import Debugger from "../Debugger";
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

/**
 * 
 */
const subscriptions: Record<string, Function[]> = {}


export const getWebRTCConnection = function getWebRTCConnection(): RTCPeerConnection | null {
  return WebRTCConnection
}

export const isConnected = function isConnected(): boolean {
  return WebRTCConnection !== null && WebRTCConnection?.connectionState === 'connected'
}

export const isFailed = function isFailed(): boolean {
  return WebRTCConnection !== null && WebRTCConnection?.connectionState === 'failed'
}

/**
 * The connection state change handler, _after_ the connection has been established
 */
export const onConnectionStateChange = function onConnectionStateChange(event: Event) {
  console.log("onConnectionStateChange", WebRTCConnection?.connectionState, Date.now())

  if (Array.isArray(subscriptions['connectionStateChange'])) {
    for (let handler of subscriptions["connectionStateChange"]) {
      // RTCPeerConnectionState: "closed" | "connected" | "connecting" | "disconnected" | "failed" | "new"
      handler(WebRTCConnection?.connectionState, event)
    }
  }
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
      CommandChannel.onerror = (event) => {
        console.log("CommandChannel error", event, Date.now())
      }
      CommandChannel.onclosing = (event) => {
        console.log("CommandChannel closing", event, Date.now())

        if (Array.isArray(subscriptions['channelStateChange'])) {
          for (let handler of subscriptions["channelStateChange"]) {
            handler('closing')
          }
        }
      }
      CommandChannel.onclose = (event) => {
        console.log("CommandChannel close", event, Date.now())

        if (Array.isArray(subscriptions['channelStateChange'])) {
          for (let handler of subscriptions["channelStateChange"]) {
            handler('close')
          }
        }
      }

      // TODO: separate signal on receive message
      // Signal channel is only for receiving messages
      SignalChannel = WebRTCConnection.createDataChannel("signal")
      SignalChannel.onmessage = (event) => {
        // console.log("SignalChannel")
        onReceiveMessage(event)
      }
      SignalChannel.onerror = (event) => {
        console.log("SignalChannel error", event, Date.now())
      }
      SignalChannel.onclosing = (event) => {
        console.log("SignalChannel closing", event, Date.now())

        if (Array.isArray(subscriptions['channelStateChange'])) {
          for (let handler of subscriptions["channelStateChange"]) {
            handler('closing')
          }
        }
      }
      SignalChannel.onclose = (event) => {
        console.log("SignalChannel close", event, Date.now())

        if (Array.isArray(subscriptions['channelStateChange'])) {
          for (let handler of subscriptions["channelStateChange"]) {
            handler('close')
          }
        }
      }

      // Resolve the promise when the connection is established
      WebRTCConnection.onconnectionstatechange = (event: Event) => {
        console.log("WebRTC - connection state change", event, Date.now())

        if (isConnected()) {
          
          // Replace this event handler. We only want to resolve once
          WebRTCConnection && (WebRTCConnection.onconnectionstatechange = onConnectionStateChange)
          
          if (Array.isArray(subscriptions['connectionStateChange'])) {
            for (let handler of subscriptions["connectionStateChange"]) {
              handler(WebRTCConnection?.connectionState, event)
            }
          }


        // Log stats
        if (WebRTCConnection) {
          WebRTCConnection
            .getReceivers()
            .forEach(
              (
                receiver: RTCRtpReceiver,
                index: number,
                array: RTCRtpReceiver[]
              ) => {
                if (receiver.track.kind !== "video") {
                  return
                }

                // Emit video connection state changes
                if (receiver.transport) {
                  receiver.transport.onstatechange = function(state) {  
                    console.log("transport state", state, Date.now())

                    if (Array.isArray(subscriptions['channelStateChange'])) {
                      for (let handler of subscriptions["channelStateChange"]) {
                        handler(state)
                      }
                    }
                  }
                }

                // TODO: Put in 100ms interval to track frames per second
                // setTimeout(() => {
                //   receiver.getStats().then((myStatsReport: RTCStatsReport) => {
                //     myStatsReport.forEach(
                //       (statValue: any, key: string, parent: RTCStatsReport) => {
                //         if (statValue.type == "inbound-rtp") {
                //           console.log(
                //             "The PC stats returned the framesPerSecond value " +
                //             statValue["framesPerSecond"] +
                //             " while the full inbound-rtp stats reflect as " +  
                //             JSON.stringify(statValue, null, 4)
                //           );
                //         }
                //       }
                //     );
                //   });                
                // }, 2000)
                
              }
            );
          }

          resolve(WebRTCConnection as RTCPeerConnection)
        }

        if (isFailed()) {
          // TODO: Show message ?
          // TODO: Auto retry ? After delay of x seconds ? 
          console.error("WebRT - Failed connection", Date.now())

          // Remove this event handler. We only want to resolve once
          WebRTCConnection && (WebRTCConnection.onconnectionstatechange = null)
          
          if (Array.isArray(subscriptions['connectionStateChange'])) {
            for (let handler of subscriptions["connectionStateChange"]) {
              handler(WebRTCConnection?.connectionState, event)
            }
          }

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

  // console.log("sending message", message)

  if (!isConnected()) {
    console.error("WebRTC - not connected") // TODO: Throw Exception

    return
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


const lastReceivedMessagesByType: Record<MessageType, string|undefined> = {
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

/**
 * Whether the contents of the previous message of a particular type had the exact same contents
 */
const ignoreReceivedMessages = (type: MessageType, message: IMessage ) => {
  const json = JSON.stringify(message)

  if (lastReceivedMessagesByType[type] && lastReceivedMessagesByType[type] === json) {
    return true
  }

  lastReceivedMessagesByType[type] = json
  return false
}

/**
 * On receiving a data message from the command channel
 */
const onReceiveMessage = function onReceiveMessage(event: MessageEvent) {
  // console.log(event.data)

  // TODO: Check that we have received a full frame AND its payload. This essentially means the array buffer is at least 10+1 bytes long

  const frame = Frame.fromBytes(event.data)

  // Debugger.log("WebRTC - frame", frame)

  // Generic handlers
  if (Array.isArray(subscriptions["*"])) {
    for (let handler of subscriptions["*"]) {
      handler(event)
    }
  }

  // 
  switch (frame.messageType) {
    case MessageType.ECHO:
      
      const echo = Echo.fromBytes(event.data.slice(10)) 
      
      // Publish event to handlers
      if (Array.isArray(subscriptions[MessageType.ECHO])) {
        for (let handler of subscriptions[MessageType.ECHO]) {
          handler(echo)
        }
      }

      break
    case MessageType.STATUS:
      const moduleStatus = ModuleStatus.fromBytes(event.data.slice(10)) // TODO: This is temporary, frame/payload boundary could change
      // console.log(moduleStatus)
      break
    case MessageType.ENGINE:
      const engine = Engine.fromBytes(event.data.slice(10)) // TODO: This is temporary, frame/payload boundary could change

      if (ignoreReceivedMessages(frame.messageType, engine)) {
        break;
      }

      // Publish event to handlers
      if (Array.isArray(subscriptions[MessageType.ENGINE])) {
        for (let handler of subscriptions[MessageType.ENGINE]) {
          handler(engine)
        }
      }
      break
    case MessageType.CONTROL:
      const control = Control.fromBytes(event.data.slice(10)) // TODO: This is temporary, frame/payload boundary could change
      // console.log(control)
      break
    case MessageType.MOTION:
      const motion = Motion.fromBytes(event.data.slice(10)) // TODO: This is temporary, frame/payload boundary could change
      // console.log(motion)
      break
    case MessageType.INSTANCE:
      const instance = Instance.fromBytes(event.data.slice(10)) // TODO: This is temporary, frame/payload boundary could change
      // console.log(instance)
      // TODO: Verify instance id
      // TODO: Verify version 
      break
    case MessageType.ROTATOR:
      // TODO: Implement... 3d vector - ignore every 50ms hide message
      // console.log("WebRTC - received rotator message")
      break
    case MessageType.ACTOR:
      // TODO: Implement... - 3d presentation
      // console.log("WebRTC - received actor message")
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

/**
 * Subsribe to WebRTC events
 * TODO: Refactor subscribe, etc to XBOXControls structure ?
 * TODO: Maybe create generic PubSub class ?
 */
export const subscribe = function(channel: MessageType|"*"|"connectionStateChange"|"channelStateChange", handler: Function) {
  subscriptions[channel] = subscriptions[channel] || []
  subscriptions[channel].push(handler)
}


export const connectVideoElement = (video: HTMLVideoElement) => {
  if (VideoStream) {
    video.srcObject = VideoStream
  }
}