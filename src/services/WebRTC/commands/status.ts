import { MessageType, type IMessage } from "."

/******************************************************************************
 * Module status
 */
export enum ModuleState {
  Healthy = 0xF8,
  Degraded = 0xF9,
  Faulty = 0xFA,
  Emergency = 0xFB,
}

// TODO: Values can change in the future
export enum ModuleError {
  InvalidConfiguration = 0,
  VersionMismatch = 1,
  CommunicationTimeout = 2,
  GenericCommunicationError = 3,
  IOError = 4,
}

export class ModuleStatus implements IMessage {
  messageType = MessageType.STATUS

  name: string
  state: ModuleState
  error_code: ModuleError

  constructor(name: string, state: ModuleState, error_code: ModuleError) {
    this.name = name
    this.state = state
    this.error_code = error_code
  }

  static fromBytes(data: ArrayBuffer): ModuleStatus {
    const dataView = new DataView(data)

    const nameLength = dataView.getUint16(0, false)
    const name = new TextDecoder().decode(new Uint8Array(data, 2, nameLength))

    const state = dataView.getUint8(2 + nameLength) as ModuleState
    const errorCode = dataView.getUint8(3 + nameLength) as ModuleError

    return new ModuleStatus(name, state, errorCode)
  }

  toBytes(): ArrayBuffer {
    const nameBytes = new TextEncoder().encode(this.name)
    const buffer = new ArrayBuffer(4 + nameBytes.byteLength)
    const dataView = new DataView(buffer)

    dataView.setUint16(0, nameBytes.byteLength, false)
    new Uint8Array(buffer).set(nameBytes, 2)
    dataView.setUint8(2 + nameBytes.byteLength, this.state)
    dataView.setUint8(3 + nameBytes.byteLength, this.error_code)

    return buffer
  }
}
