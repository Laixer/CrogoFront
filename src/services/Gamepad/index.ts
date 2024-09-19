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

  XBOXControlsInstance.subscribe('gamepad.btn', function (event: ButtonEvent) {
    switch (event.btn) {
      case Button.B: {
        if (event.value === 1) {
          Cargo.stopAllMotion()
        } else {
          Cargo.resumeAllMotion()
        }
        break
      }
      case Button.LB: {
        // LIMP_LEFT backwards if event.value === 1
        break
      }
      case Button.RB: {
        // LIMP_RIGHT backwards if event.value === 1
        break
      }
      case Button.X: {
        // This locks both tracks together
        // set drive lock if event.value === 1
        break
      }
      case Button.LT: {
        const value = scaleAxisValue(event.value)
        console.log('Cargo.motionChange', 'Actuator.LEFT_TRACK', value)
        // Cargo.motionChange(Actuator.LIMP_LEFT, scaleAxisValue(value))
        break
      }
      case Button.RT: {
        const value = scaleAxisValue(event.value)
        console.log('Cargo.motionChange', 'Actuator.RIGHT_TRACK', value)
        // Cargo.motionChange(Actuator.LIMP_RIGHT, scaleAxisValue(value))
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
          // Cargo.motionChange(ActuatorByAxis[event.axis], scaleAxisValue(value))
          break
        }
        case Actuator.ATTACHMENT: {
          // attachment left is positive
          const value = Math.round((scaleAxisValue(event.value) * -1) / 2)
          console.log('Cargo.motionChange', 'Actuator.ATTACHMENT', value)
          // Cargo.motionChange(ActuatorByAxis[event.axis], scaleAxisValue(value))
          break
        }
        case Actuator.ARM: {
          // arm out is positive
          const value = Math.round((scaleAxisValue(event.value) * -1) / 2)
          console.log('Cargo.motionChange', 'Actuator.ARM', value)
          // Cargo.motionChange(ActuatorByAxis[event.axis], scaleAxisValue(value))
          break
        }
        case Actuator.SLEW: {
          // slew left is positive
          const value = Math.round((scaleAxisValue(event.value) * -1) / 2)
          console.log('Cargo.motionChange', 'Actuator.SLEW', value)
          // Cargo.motionChange(ActuatorByAxis[event.axis], scaleAxisValue(value))
          break
        }
        // default: {
        //   const value = scaleAxisValue(event.value)
        //   // console.log('Cargo.motionChange', ActuatorByAxis[event.axis], value)
        //   Cargo.motionChange(ActuatorByAxis[event.axis], scaleAxisValue(value))
        //   break
        // }
      }

    }
  })

  return XBOXControlsInstance
}
