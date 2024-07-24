import { setRemoteDescription } from "@/services/WebRTC"
import { WebSocketCommand } from "."


/**
 * Websocket command to setup the RTC connection
 */
export class RTCSetupCommand extends WebSocketCommand {

  method = "setup_rtc"

  constructor(params: string[]) {
    super()

    this.params = params
    this.handler = this.handleMessage
  }

  handleMessage(message: { result: string }) {
    setRemoteDescription(message.result)
  }
}