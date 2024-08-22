import { WebSocketCommand } from "."

/**
 * Websocket command to reboot
 */
export class RebootCommand extends WebSocketCommand {

  method = "reboot"

  constructor() {
    super()

    this.params = [ 
      { connection_id: this.connectionId }
    ]

    this.handler = this.handleMessage
  }

  
  handleMessage(message: { result: null }) {
    if (message.result !== null) {
      console.error("RTCReboot - Error", message)
    }
  }
}


/**
 * Websocket command to reboot
 */
export class DisconnectRTCCommand extends WebSocketCommand {

  method = "disconnect_rtc"

  constructor() {
    super()

    this.params = [
      { connection_id: this.connectionId }
    ]

    this.handler = this.handleMessage
  }

  
  handleMessage(message: { result: null }) {
    if (message.result !== null) {
      console.error("RTC Disconnect - Error", message)
    }
  }
}