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
          const valueScaled = scaleAxisValue(event.value) * -1
          if (valueScaled < 0) {
            const valueScaledRamped = valueScaled < -3500 ? valueScaled : 0
            const value = valueScaledRamped
            console.log('Cargo.motionChange', 'Actuator.BOOM', value)
            Cargo.motionChange(ActuatorByAxis[event.axis], value)
          } else {
            const valueScaled2 = valueScaled / 2
            const valueScaledRamped = valueScaled < 1750 ? 0 : valueScaled2
            console.log('Cargo.motionChange', 'Actuator.BOOM', valueScaledRamped)
            Cargo.motionChange(ActuatorByAxis[event.axis], valueScaledRamped)
          }
          break
        }
        case Actuator.ATTACHMENT: {
          // attachment left is positive
          const valueScaled = scaleAxisValue(event.value) * -1
          if (valueScaled < 0) {
            const valueScaled2 = valueScaled / 2
            const valueScaledRamped = valueScaled < -2000 ? valueScaled2 : 0
            console.log('Cargo.motionChange', 'Actuator.ATTACHMENT', valueScaledRamped)
            Cargo.motionChange(ActuatorByAxis[event.axis], valueScaledRamped)
          } else {
            const valueScaledRamped = valueScaled < 4000 ? 0 : valueScaled
            console.log('Cargo.motionChange', 'Actuator.ATTACHMENT', valueScaledRamped)
            Cargo.motionChange(ActuatorByAxis[event.axis], valueScaledRamped)
          }
          break
        }
        case Actuator.ARM: {
          // arm out is positive
          const valueScaled = scaleAxisValue(event.value) * -1
          const valueScaled2 = valueScaled / 2
          if (valueScaled2 < 0) {
            const valueScaledRamped = valueScaled2 < -1500 ? valueScaled2 : 0
            console.log('Cargo.motionChange', 'Actuator.ARM', valueScaledRamped)
            Cargo.motionChange(ActuatorByAxis[event.axis], valueScaledRamped)
          } else {
            const valueScaledRamped = valueScaled2 < 1500 ? 0 : valueScaled2
            console.log('Cargo.motionChange', 'Actuator.ARM', valueScaledRamped)
            Cargo.motionChange(ActuatorByAxis[event.axis], valueScaledRamped)
          }

          break
        }
        case Actuator.SLEW: {
          // slew left is positive
          const valueScaled = scaleAxisValue(event.value) * -1
          const valueScaled2 = valueScaled / 2
          if (valueScaled2 < 0) {
            const valueScaledRamped = valueScaled2 < -1000 ? valueScaled2 : 0
            console.log('Cargo.motionChange', 'Actuator.SLEW', valueScaledRamped)
            Cargo.motionChange(ActuatorByAxis[event.axis], valueScaledRamped)
          } else {
            const valueScaledRamped = valueScaled2 < 1000 ? 0 : valueScaled2
            console.log('Cargo.motionChange', 'Actuator.SLEW', valueScaledRamped)
            Cargo.motionChange(ActuatorByAxis[event.axis], valueScaledRamped)
          }
          break
        }
      }

    }
  })

  return XBOXControlsInstance
}
