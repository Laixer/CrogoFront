const configuration = {
  bundlePolicy: "max-bundle", iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
  ],
};

const pc = new RTCPeerConnection(configuration);
pc.addTransceiver('video', { direction: 'recvonly' });

pc.onicegatheringstatechange = ev => {
  let connection = ev.target;

  switch (connection.iceGatheringState) {
    case "gathering":
      console.log("ICE gathering state change: gathering");
      break;
    case "complete":
      console.log("ICE gathering state change: complete");
      console.log(pc.localDescription)

      const dataToSend = {
        type: "peer",
        topic: "offer",
        payload: pc.localDescription
      };

      webSocket.send(JSON.stringify(dataToSend));
      break;
  }
}

pc.ontrack = (event) => {
  console.log("Track event", event);

  const remoteView = document.getElementById("remoteVideo");
  remoteView.srcObject = event.streams[0];
};