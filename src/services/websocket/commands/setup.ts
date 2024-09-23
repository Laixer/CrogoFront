import { setRemoteDescription } from '@/services/WebRTC'
import { WebSocketCommand } from '.'
import { PubSubEvent, PubSubService } from '@/services/PubSubService'

export class RTCSetupErrorEvent extends PubSubEvent {
  code: number
  message: string
  id: string

  constructor(code: number, message: string, id: string) {
    super('RTCSetupErrorEvent')
    this.code = code
    this.message = message
    this.id = id
  }
}

/**
 * Websocket command to start the setup of the RTC connection
 */
export class RTCSetupCommand extends WebSocketCommand {
  method = 'setup_rtc'

  constructor(
    offer: RTCSessionDescription | RTCSessionDescriptionInit,
    hash: string,
    resolution: string
  ) {
    super()

    this.params = [
      {
        video_track: 0,
        // video_size: resolution,
        connection_id: this.connectionId,
        auth_token: hash
      },
      offer
    ]

    this.handler = this.handleMessage
  }

  handleMessage(message: {
    id: string
    result?: RTCSessionDescription
    error?: { code: number; message: string }
  }) {
    console.log('RTC SetupCommand', message)

    if (message.result) {
      setRemoteDescription(message.result)
    } else if (message.error) {
      PubSubService.emit(
        'error.rtc.setup',
        new RTCSetupErrorEvent(message.error?.code || 0, message.error?.message || '', message.id)
      )
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
        connection_id: this.connectionId,
        auth_token: 'onzin'
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
