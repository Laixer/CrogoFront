import { setRemoteDescription } from "@/services/WebRTC"
import { WebSocketCommand } from "."


/**
 * Websocket command to start the setup of the RTC connection
 */
export class RTCSetupCommand extends WebSocketCommand {

  method = "setup_rtc"

  constructor(offer: RTCSessionDescription|RTCSessionDescriptionInit) {
    super()

    this.params = [
      {
        video_track: 3,
        video_size: "1280x720",
        user_agent: "laixer-remote"
      },
      offer
    ]
    this.handler = this.handleMessage
  }

  handleMessage(message: { result: RTCSessionDescription }) {
    setRemoteDescription(message.result)
  }
}

/**
 * Websocket command to communicate the availability of a new RTC candidate
 */
export class RTCCandidateCommand extends WebSocketCommand {

  method = "update_rtc"

  constructor(candidate: RTCIceCandidate) {
    super()

    this.params = [ candidate ]

    this.handler = this.handleMessage
  }

  
  handleMessage(message: null) {
    if (message !== null) {
      console.error("RTCCandidateCommand - Error", message)
    }
  }
}