/**
 * Size of the GLONAX protocol header in bytes.
 */
export const GLONAX_PROTOCOL_HEADER_SIZE = 10
/**
 * Magic header value for the GLONAX protocol.
 */
const GLONAX_PROTOCOL_HEADER_MAGIC = 'LXR'
/**
 * Version of the GLONAX protocol.
 */
const GLONAX_PROTOCOL_VERSION = 0x03

/**
 * Message interface
 */
export interface IMessage {
  messageType: MessageType
  toBytes(): ArrayBuffer
}

/**
 * Message type
 */
export enum MessageType {
  ERROR = 0x00, // Future use
  ECHO = 0x01, // Robot -> Operator, Operator -> Robot -- latency measurement - roundtrip "signal icon"
  SESSION = 0x10, // Handled by glonax-agent --
  SHUTDOWN = 0x11, // Deprecated
  REQUEST = 0x12, // Deprecated
  INSTANCE = 0x15, // Handled by glonax-agent -- uuid of crane, name, version, serial number, etc. show in context panel
  STATUS = 0x16, // Robot -> Operator
  MOTION = 0x20, // Robot -> Operator, Operator -> Robot
  SIGNAL = 0x31, // Deprecated
  ACTOR = 0x40, // Robot -> Operator
  VMS = 0x41, // Deprecated
  GNSS = 0x42, // Future use
  ENGINE = 0x43, // Robot -> Operator, Operator -> Robot
  TARGET = 0x44, // Operator -> Robot
  CONTROL = 0x45, // Operator -> Robot, Robot -> Operator (future)
  ROTATOR = 0x46 // Robot -> Operator -- "raw" data not really necesary, because already provided by actuator
}

/**
 * Frame
 */
export class Frame {
  messageType: MessageType
  messageLength: number

  constructor(messageType: MessageType, messageLength: number) {
    this.messageType = messageType
    this.messageLength = messageLength
  }

  static fromBytes(arrayBuffer: ArrayBuffer): Frame {
    const dataView = new DataView(arrayBuffer)

    // TODO: Maybe throw a custom error instead of the generic Error
    if (arrayBuffer.byteLength < GLONAX_PROTOCOL_HEADER_SIZE) {
      throw new Error('Insufficient data for header')
    }

    // Check header magic bytes
    const headerMagic = new TextDecoder().decode(new Uint8Array(arrayBuffer, 0, 3))
    if (headerMagic !== GLONAX_PROTOCOL_HEADER_MAGIC) {
      throw new Error('Invalid header received')
    }

    // Check protocol version
    if (dataView.getUint8(3) !== GLONAX_PROTOCOL_VERSION) {
      throw new Error('Invalid protocol version')
    }

    // Get message type
    const messageType = dataView.getUint8(4) as MessageType

    // Get message length (big-endian 16-bit unsigned integer)
    const messageLength = dataView.getUint16(5, false) // false for big-endian

    // Check header padding
    if (dataView.getUint8(7) !== 0 || dataView.getUint8(8) !== 0 || dataView.getUint8(9) !== 0) {
      throw new Error('Invalid header padding')
    }

    return new Frame(messageType, messageLength)
  }

  toBytes(): ArrayBuffer {
    const buffer = new ArrayBuffer(GLONAX_PROTOCOL_HEADER_SIZE)
    const dataView = new DataView(buffer)

    // Write header magic bytes
    const headerMagic = new TextEncoder().encode(GLONAX_PROTOCOL_HEADER_MAGIC)
    dataView.setUint8(0, headerMagic[0])
    dataView.setUint8(1, headerMagic[1])
    dataView.setUint8(2, headerMagic[2])

    // Write the protocol version (unsigned 8-bit integer)
    dataView.setUint8(3, GLONAX_PROTOCOL_VERSION)

    // Write the type value (unsigned 8-bit integer)
    dataView.setUint8(4, this.messageType)

    // Write the length of the data (big-endian 16-bit unsigned integer)
    dataView.setUint16(5, this.messageLength, false) // false for big-endian

    // Write padding bytes
    dataView.setUint8(7, 0)
    dataView.setUint8(8, 0)
    dataView.setUint8(9, 0)

    return buffer
  }
}
