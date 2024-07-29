import { MessageType, type IMessage } from "."

/******************************************************************************
 * Echo
 */
export class Echo implements IMessage {
  messageType = MessageType.ECHO

  payload: bigint

  constructor(payload: bigint) {
    this.payload = payload
  }

  static fromBytes(data: ArrayBuffer): Echo {
    const dataView = new DataView(data)

    const payload = dataView.getBigUint64(0)

    return new Echo(payload)
  }

  toBytes(): ArrayBuffer {
    const buffer = new ArrayBuffer(8)
    const dataView = new DataView(buffer)

    dataView.setBigInt64(0, this.payload)
    
    return buffer
  }
}