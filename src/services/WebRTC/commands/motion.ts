import { Command } from "."
import type { ICommand } from "."

/******************************************************************************
 * Motion Change
 */
export declare type TMotionChangeCommandParams = {
  actuator: string
  value: number
}

export interface IMotionCommand extends ICommand {
  topic: 'motion'
}
export class MotionCommand extends Command implements IMotionCommand {
  topic: 'motion' = 'motion'
}

export interface IMotionChangeCommand extends IMotionCommand {
  payload: {
    type: number
    change?: TMotionChangeCommandParams[]
  }
}

export class MotionChangeCommand extends MotionCommand implements IMotionChangeCommand {
  payload: { type: number; change: TMotionChangeCommandParams[] };

  constructor(type: number, { actuator, value }: TMotionChangeCommandParams) {
    super()

    this.payload = {
      type,
      change: [
        { actuator, value }
      ]
    }
  }
}


export class MotionStopAllCommand extends MotionCommand implements IMotionCommand {
  payload = {
    type: 1
  }
}


