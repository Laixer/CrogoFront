import { setRemoteDescription } from '@/services/WebRTC'
import { WebSocketCommand } from '.'

/**
 * Websocket command to start the setup of the RTC connection
 */
export class RTCSetupCommand extends WebSocketCommand {
  method = 'setup_rtc'

  constructor(offer: RTCSessionDescription | RTCSessionDescriptionInit) {
    super()

    this.params = [
      {
        video_track: 0,
        connection_id: this.connectionId
      },
      offer
    ]

    this.handler = this.handleMessage
  }

  handleMessage(message: { result: RTCSessionDescription }) {
    console.log('RTC SetupCommand', message)

    if (message.result) {
      setRemoteDescription(message.result)
    }
  }
}

/**
 * Websocket command to communicate the availability of a new RTC candidate
 */
export class RTCCandidateCommand extends WebSocketCommand {
  method = 'update_rtc'

  constructor(candidate: RTCIceCandidate) {
    super()

    this.params = [
      {
        connection_id: this.connectionId
      },
      candidate
    ]

    this.handler = this.handleMessage
  }

  handleMessage(message: { result: null }) {
    if (message.result !== null) {
      console.log('RTCCandidateCommand - Error', message)
    }
  }
}
