
import type { IWebSocketCommand } from "./commands";
import { addToQueue, handleResponseMessage } from "./queue";



// const ws_host = 'ws://localhost:8000';
const ws_host = 'wss://edge.laixer.equipment/api';

/**
 * The WebSocket instance
 */
let WebSocketConnection: WebSocket|null = null

/**
 * Make the WebSocket connection available
 *  TODO: Do we want to enable this? 
 */
export const getWebSocketConnection = function getWebSocketConnection(): WebSocket|null {
  return WebSocketConnection
}

/**
 * Verify that the websocket connection is available (and active)
 */
export const isWebSocketConnectionAvailable = function isWebSocketConnectionAvailable(): boolean {
  return WebSocketConnection !== null && WebSocketConnection?.readyState === 1
}

/**
 * Establish the websocket connection and attach event handlers
 *  
 */
export const establishWebSocketConnection = function establishWebSocketConnection({ 
  instanceId,
  onOpen
}: {
  instanceId: string
  onOpen?: (this: WebSocket, ev: Event) => any
}) {

  if (WebSocketConnection !== null) {
    console.error("Websocket - connection already established")

    // TODO: Use isWebSocketConnectionAvailable to maybe re-open a closed connection? 

    throw new Error("Only one connection allowed")
  }

  WebSocketConnection = new WebSocket(`${ws_host}/app/${instanceId}/ws`);

  // TODO: Update DOM indicator based on connection status (use reactivity?)
  if (onOpen) {
    WebSocketConnection.onopen = onOpen
  }
  WebSocketConnection.onclose = onClose

  WebSocketConnection.onmessage = handleResponseMessage
}

/**
 * Send a command 
 *  Commands are queued and include an identifier and method for handling the response
 */
export const sendCommand = function sendCommand(command: IWebSocketCommand) {
  addToQueue(command)
}

/**
 * Send a message over the websocket 
 *  This is used by the queue 
 *  It can also be used elsewhere, but it is recommended to consistently use sendCommand instead.
 */
export const sendMessage = function sendMessage(message: object) {
  try {
    console.log("Websocket - sending message", message)

    const connection = getWebSocketConnection()
    connection?.send(
      JSON.stringify(message)
    )

    console.log("Websocket - message sent")
    return true
  } catch(err) {
    console.error("Websocket - failed to send message", err)
    return false
  }
}


/**
 * Upon opening a connection immediately use it to establish 
 */
// const onOpen = function onOpen() {
//   console.log("Websocket - connection opened")
//   createWebRTCOffer()
// }
const onClose = function onClose() {
  console.log("Websocket - connection closed")
}


