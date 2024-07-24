

export const establishLiveVideoConnection = function establishLiveVideoConnection(
  {
    VideoElement,
    connection
  } : {
    VideoElement: HTMLMediaElement,
    connection: RTCPeerConnection
  }
) {

  // TODO: Catch InvalidStateError (e.g. connection is closed)
  connection.addTransceiver('video', { direction: 'recvonly' })

  // TODO: Catch exceptions
  connection.ontrack = (event: RTCTrackEvent) => {
    console.log("Track event", event);

    if(event.streams.length) {
      VideoElement.srcObject = event.streams[0]
    } else {
      console.error("Track event - missing stream data")
    }
  }
}