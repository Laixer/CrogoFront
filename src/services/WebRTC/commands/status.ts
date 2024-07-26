/******************************************************************************
 * Module status
 */
export class ModuleStatus {
  name: string
  state: number // TODO: Enum
  error_code: number // TODO: Enum

  constructor(name: string, state: number, error_code: number) {
    this.name = name
    this.state = state
    this.error_code = error_code
  }

  static fromBytes(data: ArrayBuffer): ModuleStatus {
    const dataView = new DataView(data)

    const nameLength = dataView.getUint16(0, false)
    const name = new TextDecoder().decode(new Uint8Array(data, 2, nameLength))

    const state = dataView.getUint8(2 + nameLength)
    const errorCode = dataView.getUint8(3 + nameLength)

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
