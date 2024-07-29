import { parse, stringify } from "uuid"
import { MessageType, type IMessage } from "."

// TODO: Maybe move up
export enum MachineType {
  EXCAVATOR = 1,
  WHEEL_LOADER = 2,
  DOZER = 3,
  GRADER = 4,
  HAULER = 5,
  FORESTRY = 6
}

export class Instance implements IMessage {
  messageType = MessageType.INSTANCE

  id: string // UUID
  model: string
  machine_type: MachineType
  version: [number, number, number]
  serial_number: string

  constructor(id: string, model: string, machine_type: MachineType, version: [number, number, number], serial_number: string) {
    this.id = id
    this.model = model
    this.machine_type = machine_type
    this.version = version
    this.serial_number = serial_number
  }

  get version_string(): string {
    return `${this.version[0]}.${this.version[1]}.${this.version[2]}`
  }

  static fromBytes(data: ArrayBuffer): Instance {
    const dataView = new DataView(data)

    const id = stringify(new Uint8Array(data, 0, 16))
    const machine_type = dataView.getUint8(16) as MachineType
    const version = [dataView.getUint8(17), dataView.getUint8(18), dataView.getUint8(19)] as [number, number, number]

    const modelLength = dataView.getUint16(20, false)
    const model = new TextDecoder().decode(new Uint8Array(data, 22, modelLength))

    const serialNumberLength = dataView.getUint16(22 + modelLength, false)
    const serialNumber = new TextDecoder().decode(new Uint8Array(data, 24 + modelLength, serialNumberLength))

    return new Instance(id, model, machine_type, version, serialNumber)
  }

  toBytes(): ArrayBuffer {
    const idBytes = parse(this.id)
    const modelBytes = new TextEncoder().encode(this.model)
    const serialNumberBytes = new TextEncoder().encode(this.serial_number)
    const buffer = new ArrayBuffer(24 + modelBytes.byteLength + serialNumberBytes.byteLength)
    const dataView = new DataView(buffer)

    new Uint8Array(buffer).set(idBytes, 0)

    dataView.setUint8(16, this.machine_type)
    dataView.setUint8(17, this.version[0])
    dataView.setUint8(18, this.version[1])
    dataView.setUint8(19, this.version[2])

    dataView.setUint16(20, modelBytes.byteLength, false)
    new Uint8Array(buffer).set(modelBytes, 22)

    dataView.setUint16(22 + modelBytes.byteLength, serialNumberBytes.byteLength, false)
    new Uint8Array(buffer).set(serialNumberBytes, 24 + modelBytes.byteLength)

    return buffer
  }
}