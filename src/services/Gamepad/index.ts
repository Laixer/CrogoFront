import Cargo from '@/services/cargo'
import { Actuator } from '@/services/WebRTC/commands/motion'
import { Axis, AxisEvent, Button, ButtonEvent, XBOXControls } from '@/services/XBOXControls'

let XBOXControlsInstance

/**
 * Scale from range(-1,1) to range(-32000, 32000)
 */
function scaleAxisValue(axisValue: number) {
  // Ensure the input is within the [-1, 1] range
  axisValue = Math.max(-1, Math.min(1, axisValue))

  // Scale the value
  return Math.round(axisValue * 32000)
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

  XBOXControlsInstance.subscribe('gamepad.btn', function (event: ButtonEvent) {
    if (event.btn === Button.B) {
      if (event.pressed) {
        Cargo.stopAllMotion()
      } else {
        Cargo.resumeAllMotion()
      }
    }
  })

  XBOXControlsInstance.subscribe('gamepad.axis', function (event: AxisEvent) {
    if (Object.prototype.hasOwnProperty.call(ActuatorByAxis, event.axis)) {

      switch (ActuatorByAxis[event.axis]) {
        case Actuator.BOOM: {
          const value = Math.round((scaleAxisValue(event.value) * -1) / 2)
          // console.log('Cargo.motionChange', 'Actuator.BOOM', value)
          Cargo.motionChange(ActuatorByAxis[event.axis], scaleAxisValue(event.value))
          break
        }
        case Actuator.ATTACHMENT: {
          const value = Math.round((scaleAxisValue(event.value) * 1) / 2)
          // console.log('Cargo.motionChange', 'Actuator.ATTACHMENT', value)
          Cargo.motionChange(ActuatorByAxis[event.axis], scaleAxisValue(event.value))
          break
        }
        default: {
          const value = scaleAxisValue(event.value)
          // console.log('Cargo.motionChange', ActuatorByAxis[event.axis], value)
          Cargo.motionChange(ActuatorByAxis[event.axis], scaleAxisValue(event.value))
          break
        }
      }

    }
  })

  return XBOXControlsInstance
}
