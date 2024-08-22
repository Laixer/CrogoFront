import { initiateRTCConnection } from "./WebRTC"
import { establishWebSocketConnection } from "./websocket"



class Crogo {

  /**
   * Uuid of the connected machine
   */
  instanceId: string

  /**
   * The connection state
   *  TODO: Link to P2P connection state
   */
  connectionState: 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | null = null

  /**
   * 
   */
  WebSocketConnection: WebSocket | null = null

  /**
   * 
   */
  WebRCTConnection: RTCPeerConnection | null = null

  /**
   * Connect the machine
   */
  constructor(instanceId: string) {
    this.instanceId = instanceId
  }

  /**
   * Establish the connection to the machine
   */
  async connect() {
    if (this.connectionState === 'CONNECTED') {
      throw new Error(`Cargo - ${this.instanceId} - Already connected`)
    }
    if (this.connectionState === 'CONNECTING') {
      throw new Error(`Cargo - ${this.instanceId} - Already connecting`)
    }

    // TODO: this.WebSocketConnection = New WebSocketConnection(this.instanceId)
    // TODO: await this.WebSocketConnection.connect()

    // init connection 
    await establishWebSocketConnection({
      instanceId: this.instanceId
    })
      .then((WebSocketConnection) => {
        this.WebSocketConnection = WebSocketConnection
      })
      .catch((err: Error) => {
        console.log("Cargo - failed to connect websocket")
        throw err
      })

    console.log("Cargo - websocket connected")
  
    await initiateRTCConnection()
      .then((WebRCTConnection) => {
        this.WebRCTConnection = WebRCTConnection
      })
      .catch((err: Error) => {
        console.log("Cargo - failed to connect WebRTC")
        throw err
      })

    // All done
    // TODO: Link to Web socket / WebRTC connection state
    this.connectionState = 'CONNECTED'
  }

  /**
   * Return the instance id of the connected machine
   */
  getInstanceId(): string {
    return this.instanceId
  }

  disconnect() {
    // TODO: disconnect websocket
    // TODO: Close data channels
    // TODO: Disconnect video
    // TODO: disconnect P2P

    this.connectionState = 'DISCONNECTED'
  }

}


export default Crogo