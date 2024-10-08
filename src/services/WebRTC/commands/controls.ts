import { MessageType, type IMessage } from '.'

/******************************************************************************
 * Controls
 */
export enum ControlType {
  HYDRAULIC_QUICK_DISCONNECT = 0x5,
  HYDRAULIC_LOCK = 0x6,
  HYDRAULIC_BOOST = 0x7,
  HYDRAULIC_BOOM_CONFLUX = 0x8,
  HYDRAULIC_ARM_CONFLUX = 0x9,
  HYDRAULIC_BOOM_FLOAT = 0xa,
  MACHINE_SHUTDOWN = 0x1b,
  MACHINE_ILLUMINATION = 0x1c,
  MACHINE_LIGHTS = 0x2d,
  MACHINE_HORN = 0x1e,
  MACHINE_STROBE_LIGHT = 0x1f,
  MACHINE_TRAVEL_ALARM = 0x20
}

export class Control implements IMessage {
  messageType = MessageType.CONTROL

  type: ControlType
  value: boolean

  constructor(type: ControlType, value: boolean) {
    this.type = type
    this.value = value
  }

  static fromBytes(data: ArrayBuffer): Control {
    const dataView = new DataView(data)

    const type = dataView.getUint8(0)
    const value = !!dataView.getUint8(1)

    return new Control(type, value)
  }

  toBytes(): ArrayBuffer {
    const buffer = new ArrayBuffer(2)
    const dataView = new DataView(buffer)

    dataView.setUint8(0, this.type)
    dataView.setUint8(1, this.value ? 1 : 0)

    return buffer
  }
}
