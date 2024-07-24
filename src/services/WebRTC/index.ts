

import { getWebSocketConnection, isWebSocketConnectionAvailable, sendCommand } from "../websocket";
import { RTCSetupCommand } from "../websocket/commands/setup";
import type { ICommand } from "./commands";

const configuration: RTCConfiguration = {
  bundlePolicy: "max-bundle", 
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
  ],
}

let WebRTCConnection: RTCPeerConnection|null = null

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

  WebRTCConnection.onicegatheringstatechange = onicegatheringstatechange

  WebRTCConnection.createOffer().then(offer => {
    WebRTCConnection && WebRTCConnection.setLocalDescription(offer)
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
 * Handle gathering state changes
 */
const onicegatheringstatechange = function onicegatheringstatechange(ev: Event) {
  const connection = ev.target as RTCPeerConnection;

  switch (connection.iceGatheringState) {
    case "gathering":
      console.log("WebRTC - ICE gathering state change: gathering");
      break;

    case "complete":
      console.log("WebRTC - ICE gathering state change: complete");
      console.log(WebRTCConnection?.localDescription)

      // Setup RTC through the websocket connection
      sendCommand(
        new RTCSetupCommand([
          WebRTCConnection?.localDescription?.sdp || ''
        ])
      )
      break;
  }
}


// TODO: No longer necessary ??
// export const createWebRTCOffer = function createWebRTCOffer() {
//   const WebRTC = getWebRTCConnection()

//   if (WebRTC === null) {
//     console.error("WebRTC - Missing WebRTC instance while trying to create an offer")
//     return
//   }

//   // TODO: Emit signal that connection is opened (to show in the DOM)? Or after remote description ... ?
//   WebRTC.createOffer().then(offer => {
//     WebRTC.setLocalDescription(offer)
//   })
// }

/**
 * Used by the Websocket RTCSetupCommand to establish the RTC connection
 */
export const setRemoteDescription = function setRemoteDescription(sdp: string) {
  const WebRTC = getWebRTCConnection()

  if (WebRTC === null) {
    console.error("WebRTC - Missing WebRTC instance while trying to set a remote description")
    return
  }

  WebRTC.setRemoteDescription({ 
    sdp, 
    'type': 'answer' 
  })
}
