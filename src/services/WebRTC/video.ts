import { getWebRTCConnection } from "."

let _VideoElement: HTMLVideoElement | null = null

export const establishLiveVideoConnection = function establishLiveVideoConnection(
  { VideoElement } : 
  { VideoElement: HTMLVideoElement }
) {
  try {
    const connection = getWebRTCConnection()
    if (! connection) {
      throw new Error("WebRTC video - needs a connection")
    }

    // Only 1 live video connection is active at a time.
    // Calling this method twice simply replaces the destination
    if (_VideoElement === null) {
      // TODO: Catch InvalidStateError (e.g. connection is closed)
      connection.addTransceiver('video', { direction: 'recvonly' })

      // TODO: Catch exceptions
      connection.ontrack = (event: RTCTrackEvent) => {
        if(_VideoElement && event.streams.length) {
          _VideoElement.srcObject = event.streams[0]
        } else {
          console.error("Track event - missing stream data")
        }
      }
    }

    _VideoElement = VideoElement

  } catch(err) {
    console.log("WebRTC video - error", err)
    throw err
  }
}

export const disableLiveVideoConnection = function disableLiveVideoConnection() {
  try {
    const connection = getWebRTCConnection()
    if (! connection) {
      throw new Error("WebRTC video - needs a connection")
    }
    connection.ontrack = null

  } catch(err) {
    console.log("WebRTC video - error", err)
    throw err
  }
}