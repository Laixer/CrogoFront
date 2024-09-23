import Debugger from '../Debugger'
import { PubSubEvent, PubSubService } from '../PubSubService'
import type { IWebSocketCommand } from './commands'
import { addToQueue, handleResponseMessage } from './queue'

// const ws_host = 'ws://localhost:8000';
const ws_host = 'wss://edge.laixer.equipment/api'

/**
 * The WebSocket instance
 */
let WebSocketConnection: WebSocket | null = null

/**
 * The unique connection id
 */
let connectionId: number = Math.floor(100000 + Math.random() * 900000)

export class WebSocketErrorEvent extends PubSubEvent {
  message: string

  constructor(message: string) {
    super('WebSocketErrorEvent')
    this.message = message
  }
}

/**
 * Retrieve the unique connection id
 */
export const getConnectionId = function getConnectionId() {
  return connectionId
}

/**
 * Make the WebSocket connection available
 *  TODO: Do we want to enable this?
 */
export const getWebSocketConnection = function getWebSocketConnection(): WebSocket | null {
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
  instanceId
}: {
  instanceId: string
}): Promise<WebSocket> {
  return new Promise<WebSocket>((resolve, reject) => {
    if (WebSocketConnection !== null) {
      Debugger.error('Websocket - connection already established')
      console.log(WebSocketConnection)

      // TODO: Use isWebSocketConnectionAvailable to maybe re-open a closed connection?
      reject(new Error('Only one connection allowed'))
    }

    // Set a new connection id
    connectionId = Math.floor(100000 + Math.random() * 900000)

    try {
      WebSocketConnection = new WebSocket(`${ws_host}/app/${instanceId}/ws`)
    } catch (err) {
      PubSubService.emit(
        'error.websocket',
        new WebSocketErrorEvent('Failed to create a websocket connection')
      )
      WebSocketConnection = null
      reject(err)
      return
    }

    WebSocketConnection.onerror = (err) => {
      console.log(err)
      PubSubService.emit('error.websocket', new WebSocketErrorEvent('Websocket error'))
    }
    WebSocketConnection.onclose = onClose
    WebSocketConnection.onmessage = handleResponseMessage

    WebSocketConnection.onopen = function () {
      // Make TS understand that WebSocketConnection is not null...
      resolve(WebSocketConnection as WebSocket)
    }
  })
}

/**
 * Send a command
 *  Commands are queued and include an identifier and method for handling the response
 */
export const sendCommand = function sendCommand(command: IWebSocketCommand) {
  addToQueue(command, connectionId)
}

/**
 * Send a message over the websocket
 *  This is used by the queue
 *  It can also be used elsewhere, but it is recommended to consistently use sendCommand instead.
 */
export const sendMessage = function sendMessage(message: object) {
  try {
    Debugger.log('Websocket - sending message', message)

    const connection = getWebSocketConnection()
    connection?.send(JSON.stringify(message))

    Debugger.info('Websocket - message sent', message)
    return true
  } catch (err) {
    Debugger.error('Websocket - failed to send message', err)
    return false
  }
}

export const close = function close() {
  console.log('Websocket - close connection')
  if (isWebSocketConnectionAvailable()) {
    getWebSocketConnection()?.close()
  }

  WebSocketConnection = null
}

/**
 *
 */
const onClose = function onClose() {
  // TODO: Keep in mind: new connection already established when event is received for previous connection
  Debugger.info('Websocket - connection closed')
}
