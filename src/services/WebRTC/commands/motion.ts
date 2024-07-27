import { MessageType, type IMessage } from "."

/******************************************************************************
 * Motion Change
 */
export enum Actuator {
  BOOM = 0,
  ARM = 4,
  ATTACHMENT = 5,
  SLEW = 1,
  LIMP_LEFT = 3,
  LIMP_RIGHT = 2
}

export enum MotionType {
  STOP_ALL = 0x00,
  RESUME_ALL = 0x01,
  RESET_ALL = 0x02,
  STRAIGHT_DRIVE = 0x05,
  CHANGE = 0x10
}

export declare type TMotionChangeSet = {
  actuator: Actuator
  value: number
}

export declare type TMotionStraightDrive = number

export class Motion implements IMessage {
  messageType: MessageType = MessageType.MOTION

  type: MotionType
  straightDrive?: TMotionStraightDrive
  change?: TMotionChangeSet[]

  constructor(type: MotionType, straightDrive?: TMotionStraightDrive, change?: TMotionChangeSet[]) {
    this.type = type
    this.straightDrive = straightDrive
    this.change = change
  }

  static stop_all(): Motion {
    return new Motion(MotionType.STOP_ALL)
  }

  static resume_all(): Motion {
    return new Motion(MotionType.RESUME_ALL)
  }

  static reset_all(): Motion {
    return new Motion(MotionType.RESET_ALL)
  }

  static straight_drive(value: TMotionStraightDrive): Motion {
    return new Motion(MotionType.STRAIGHT_DRIVE, value)
  }

  static change(change: TMotionChangeSet[]): Motion {
    return new Motion(MotionType.CHANGE, undefined, change)
  }

  static fromBytes(data: ArrayBuffer): Motion {
    const dataView = new DataView(data)

    const type = dataView.getUint8(0) as MotionType
    let straightDrive: TMotionStraightDrive | undefined
    let change: TMotionChangeSet[] | undefined

    if (type === MotionType.STRAIGHT_DRIVE) {
      straightDrive = dataView.getInt16(1, false)
    } else if (type === MotionType.CHANGE) {
      const changeCount = dataView.getUint8(1)
      change = new Array(changeCount)
      for (let i = 0; i < changeCount; i++) {
        change[i] = {
          actuator: dataView.getUint8(2 + i * 3) as Actuator,
          value: dataView.getInt16(3 + i * 3, false)
        }
      }
    }

    return new Motion(type, straightDrive, change)
  }

  toBytes(): ArrayBuffer {
    if (this.straightDrive) {
      const buffer = new ArrayBuffer(3)
      const dataView = new DataView(buffer)

      dataView.setUint8(0, this.type)
      dataView.setInt16(1, this.straightDrive, false)

      return buffer
    } else if (this.change) {
      const buffer = new ArrayBuffer(2 + this.change.length * 3)
      const dataView = new DataView(buffer)

      dataView.setUint8(0, this.type)
      dataView.setUint8(1, this.change.length)
      this.change.forEach((change, i) => {
        dataView.setUint8(2 + i * 3, change.actuator)
        dataView.setInt16(3 + i * 3, change.value, false)
      })

      return buffer
    } else {
      const buffer = new ArrayBuffer(1)
      const dataView = new DataView(buffer)

      dataView.setUint8(0, this.type)
      return buffer
    }
  }
}
