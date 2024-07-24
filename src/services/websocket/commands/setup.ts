import { setRemoteDescription } from "@/services/WebRTC"
import { WebSocketCommand } from "."

const volvo = false

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

    // Volvo
    this.params = volvo ? [ offer.sdp ] : this.params
    this.handler = volvo ? this.handleVolVoMessage : this.handleMessage
  }

  handleMessage(message: { result: RTCSessionDescription }) {
    setRemoteDescription(message.result)
  }

  handleVolVoMessage(message: { result: string } ) {
    new RTCSessionDescription( { sdp: message.result, type: 'answer' })
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

  
  handleMessage(message: { result: null }) {
    if (message.result !== null) {
      console.error("RTCCandidateCommand - Error", message)
    }
  }
}