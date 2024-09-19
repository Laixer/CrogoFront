import Cargo from '@/services/cargo'
import { Actuator } from '@/services/WebRTC/commands/motion'
import { Axis, AxisEvent, Button, ButtonEvent, XBOXControls } from '@/services/XBOXControls'

let XBOXControlsInstance

/**
 * Scale from range(-1,1) to range(-32767, 32767)
 */
function scaleAxisValue(axisValue: number) {
  // Ensure the input is within the [-1, 1] range
  axisValue = Math.max(-1, Math.min(1, axisValue))

  // Scale the value
  return Math.round(axisValue * 32767)
}

/**
 * Matching Axis to Actuator
 */
const ActuatorByAxis = {
  [Axis.LEFTX]: Actuator.SLEW,
  [Axis.LEFTY]: Actuator.ARM,
  [Axis.RIGHTX]: Actuator.ATTACHMENT,
  [Axis.RIGHTY]: Actuator.BOOM
}

export const connectController = function () {
  XBOXControlsInstance = new XBOXControls()

  let driveLock = false
  let driveLeftBackwards = false
  let driveRightBackwards = false

  XBOXControlsInstance.subscribe('gamepad.btn', function (event: ButtonEvent) {
    switch (event.btn) {
      case Button.B: {
        if (event.isPressed()) {
          Cargo.stopAllMotion()
        } else {
          Cargo.resumeAllMotion()
        }
        break
      }
      case Button.LB: {
        driveLeftBackwards = event.isPressed()
        break
      }
      case Button.RB: {
        driveRightBackwards = event.isPressed()
        break
      }
      case Button.X: {
        driveLock = event.isPressed()
        break
      }
      case Button.LT: {
        const valueScaled = scaleAxisValue(event.value)
        const valueScaledRamped = valueScaled < 2000 ? 0 : valueScaled
        const value = driveLeftBackwards ? -valueScaledRamped : valueScaledRamped
        if (driveLock) {
          console.log('Cargo.straightDrive', value)
          Cargo.straightDrive(scaleAxisValue(value))
        } else {
          console.log('Cargo.motionChange', 'Actuator.LEFT_TRACK', value)
          Cargo.motionChange(Actuator.LIMP_LEFT, value)
        }
        break
      }
      case Button.RT: {
        const valueScaled = scaleAxisValue(event.value)
        const valueScaledRamped = valueScaled < 2000 ? 0 : valueScaled
        const value = driveRightBackwards ? -valueScaledRamped : valueScaledRamped
        if (driveLock) {
          console.log('Cargo.straightDrive', value)
          Cargo.straightDrive(value)
        } else {
          console.log('Cargo.motionChange', 'Actuator.RIGHT_TRACK', value)
          Cargo.motionChange(Actuator.LIMP_RIGHT, value)
        }
        break
      }
    }
  })

  XBOXControlsInstance.subscribe('gamepad.axis', function (event: AxisEvent) {
    if (Object.prototype.hasOwnProperty.call(ActuatorByAxis, event.axis)) {

      switch (ActuatorByAxis[event.axis]) {
        case Actuator.BOOM: {
          // boom up is negative
          const value = Math.round((scaleAxisValue(event.value) * -1) / 2)
          console.log('Cargo.motionChange', 'Actuator.BOOM', value)
          Cargo.motionChange(ActuatorByAxis[event.axis], value)
          break
        }
        case Actuator.ATTACHMENT: {
          // attachment left is positive
          const value = Math.round((scaleAxisValue(event.value) * -1) / 2)
          console.log('Cargo.motionChange', 'Actuator.ATTACHMENT', value)
          Cargo.motionChange(ActuatorByAxis[event.axis], value)
          break
        }
        case Actuator.ARM: {
          // arm out is positive
          const value = Math.round((scaleAxisValue(event.value) * -1) / 2)
          console.log('Cargo.motionChange', 'Actuator.ARM', value)
          Cargo.motionChange(ActuatorByAxis[event.axis], value)
          break
        }
        case Actuator.SLEW: {
          // slew left is positive
          const value = Math.round((scaleAxisValue(event.value) * -1) / 2)
          console.log('Cargo.motionChange', 'Actuator.SLEW', value)
          Cargo.motionChange(ActuatorByAxis[event.axis], value)
          break
        }
      }

    }
  })

  return XBOXControlsInstance
}
