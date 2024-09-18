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
  console.log('CONNECT CONTROLLER')

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
      Cargo.motionChange(ActuatorByAxis[event.axis], scaleAxisValue(event.value))
    }
  })

  return XBOXControlsInstance
}
