import { MessageType, type IMessage } from "."

/******************************************************************************
 * Echo
 */
export class Echo implements IMessage {
  messageType = MessageType.ECHO

  payload: number

  constructor(payload: number) {
    this.payload = payload
  }

  static fromBytes(data: ArrayBuffer): Echo {
    const dataView = new DataView(data)

    const payload = dataView.getUint8(0)

    return new Echo(payload)
  }

  toBytes(): ArrayBuffer {
    const buffer = new ArrayBuffer(1)
    const dataView = new DataView(buffer)

    dataView.setUint8(0, this.payload)

    return buffer
  }
}