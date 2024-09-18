/**
 * TODO: Process errors
 *  TODO: Send to central logging service (e.g. DataDog)
 *  TODO: auto retry & reconnect if possible ?
 */

import type { WebSocketCommand } from './commands'

// TODO: Turn this into an .env var
// const ws_host = 'ws://localhost:8000';
const ws_host = 'wss://edge.laixer.equipment/api'

class WebSocketConnection {
  /**
   * Uuid of the connected machine
   */
  instanceId: string

  /**
   * The WebSocket instance
   */
  connection: WebSocket | undefined

  // TODO: Queue class
  queue: [] = []

  /**
   *
   */
  constructor(instanceId: string) {
    // TODO: Check if string is valid uuid
    this.instanceId = instanceId
  }

  /**
   * Establish the WebSocket connection
   */
  async connect(): Promise<WebSocketConnection> {
    return new Promise<WebSocketConnection>((resolve, reject) => {
      const self = this
      if (this.connection) {
        console.error('WebSocket - connection already established', this.instanceId)
        reject(new Error(`Only one WebSocket connection allowed - ${this.instanceId}`))
      }

      this.connection = new WebSocket(`${ws_host}/app/${this.instanceId}/ws`)

      this.connection.onclose = this.onClose
      this.connection.onerror = this.onError
      this.connection.onmessage = this.handleResponseMessage
      this.connection.onopen = function () {
        resolve(self)
      }
    })
  }

  // TODO: handle response
  handleResponseMessage(message: any) {
    console.log(message)
  }

  /**
   *
   */
  queueMessage(message: WebSocketCommand) {}

  /**
   * Send a custom message over the WebSocket connection
   *  This is used by the queue
   *  It could also be used elsewhere, but it is recommended to use the queueMessage method instead
   */
  _send(message: object) {
    try {
      if (!this.connection) {
        throw new Error(`Websocket - no connection available - ${this.instanceId}`)
      }

      this.connection.send(JSON.stringify(message))

      return true
    } catch (err) {
      console.error('Websocket - send error', this.instanceId)
      console.error(err)

      return false
    }
  }

  /**
   * Clean up
   */
  onClose() {
    this.connection = undefined
    console.log('WebSocket - connection has closed', this.instanceId)
  }

  /**
   * Invoked when a connection is closed due to an error
   *  For example: some data could not be sent
   */
  onError(err: Event) {
    console.error('Websocket - error event', this.instanceId)
    console.error(err)
  }
}

export default WebSocketConnection
