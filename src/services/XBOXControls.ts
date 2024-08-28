
import {radial, raw} from 'gamepad-api-mappings';


class GamePadState {

  gamepad: Gamepad|Boolean

  /**
   * Track the last known state so we can emit changes to the state
   */
  lastKnownState = {
    buttons: {
      [XBOXControls.BUTTONS.A]: false,
      [XBOXControls.BUTTONS.B]: false,
      [XBOXControls.BUTTONS.X]: false,
      [XBOXControls.BUTTONS.Y]: false
    },
    axes: {
      [XBOXControls.AXIS.LEFTX]: 0,
      [XBOXControls.AXIS.LEFTY]: 0,
      [XBOXControls.AXIS.RIGHTX]: 0,
      [XBOXControls.AXIS.RIGHTY]: 0,
    }
  }

  constructor(gamepad: Gamepad) {
    this.gamepad = gamepad
  }
}


export class XBOXControls {

  static BUTTONS = {
    'A': 0,
    'B': 1,
    'X': 2,
    'Y': 3
  }

  static AXIS = {
    'LEFTX': 0,
    'LEFTY': 1,
    'RIGHTX': 2,
    'RIGHTY': 3
  }


  /**
   * Whether the gamepad state is being monitored
   *  Switches on upon connecting a gamepad controler
   *  Switches off when the state handler cannot find gamepad controllers
   */
  active = false

  /**
   * The registered gamepads and their last known (meaningful) state
   *  This allows us to ignore repeat states and emit only (meaningful) state changes
   */
  connectedGamepads: Record<number, GamePadState> = {}

  /**
   * Keep track of connected gamepads 
   */
  constructor() {
    window.addEventListener("gamepadconnected", this.registerGamepad.bind(this))
    window.addEventListener("gamepaddisconnected", this.unregisterGamepad.bind(this))
  }

  /**
   * Whether game control interaction is being monitored
   */
  isActive() {
    return this.active
  }

  /**
   * Register a game pad controller
   *  initiate with state
   */
  registerGamepad(e: GamepadEvent) {    
    if (this.connectedGamepads[e.gamepad.index]) {
      throw new Error("Gamepad id already in use")
    }

    this.connectedGamepads[e.gamepad.index] = new GamePadState(e.gamepad)

    // Start the loop, if it isn't currenly active
    if (! this.isActive()) {
      this.checkGamePadStatesLoop.apply(this)
    }
  }

  /**
   * Remove a gamepad from the list of registered gamepads
   *  TODO: What happens if gamepad at index 0 is removed? 
   */
  unregisterGamepad(e: GamepadEvent) {
    if (this.connectedGamepads[e.gamepad.index]) {
      delete this.connectedGamepads[e.gamepad.index]
    }
  }

  /**
   * This loop iterates in step with the animation frame rate.
   * Typically this is the monitor refresh rate (e.g. 16.67ms @ 60hz).
   * 
   * Do note that the animation frame rate may be reduced of stopped entirely.
   * This happens when the browser tab is moved to the background.
   * 
   * There are pros and cons to this. It locks down interaction, which can be a 
   * hinderance, but it can also prevent unintended movements. 
   */
  checkGamePadStatesLoop() {

    const gamepads = navigator
      .getGamepads()
      // Chrome always returns 4 "gamepads", proving null values if there aren't actually 4 gamepads
      .filter(gamepad => !! gamepad);

    // We keep actively watching as long as the navigator returns gamepads
    this.active = gamepads.length !== 0

    if (! this.active) {
      return 
    }




    // Go through every connected gamepad. Generally just 1...
    for(let gamepad of gamepads) {
      if (gamepad) {
        this.checkGamePadState(gamepad)
      }
    }

    /**
     * This creates an interval that matches the refresh rate of the monitor
     * (e.g. 16.67ms @60hz).
     */
    requestAnimationFrame(this.checkGamePadStatesLoop.bind(this))
  }


  /**
   * Check the button and axis states of the gamepad
   */
  checkGamePadState(gamepad: Gamepad) {
    this.checkButtonState(gamepad.buttons, this.connectedGamepads[gamepad.index].lastKnownState.buttons)
    this.checkAxisState(gamepad.axes, this.connectedGamepads[gamepad.index])
  }

  /**
   * 
   * TODO: Currently only considers // Button 1: B
   * 
   * @param gamepad 
   */
  checkButtonState(buttons: ReadonlyArray<GamepadButton>, buttonState: Record<string, Boolean>) {
    
    if (
      buttons[XBOXControls.BUTTONS.B]?.pressed !== buttonState[XBOXControls.BUTTONS.B]
    ) {
      buttonState[XBOXControls.BUTTONS.B] = buttons[XBOXControls.BUTTONS.B]?.pressed

      // TODO: emit event
      console.log("XBOXControls", XBOXControls.BUTTONS.B, buttonState[XBOXControls.BUTTONS.B])
    }
  }

  scaleAxisValue(axisValue: number) {
    // Ensure the input is within the [-1, 1] range
    axisValue = Math.max(-1, Math.min(1, axisValue));
  
    // Scale the value
    return Math.round(axisValue * 32000);
  }

  checkAxisState(axes: ReadonlyArray<number>, state: GamePadState) {
    // console.log(axes)

    // Left
    const coord = {x: axes[0], y: axes[1]};
    let force = radial(coord, 0.2, raw);
    force.x = this.scaleAxisValue(force.x)
    force.y = this.scaleAxisValue(force.y)

    if (state.lastKnownState.axes[XBOXControls.AXIS.LEFTX] !== force.x) {
      state.lastKnownState.axes[XBOXControls.AXIS.LEFTX] = force.x
      console.log("X", state.lastKnownState.axes[XBOXControls.AXIS.LEFTX])
    } 
    if (state.lastKnownState.axes[XBOXControls.AXIS.LEFTY] !== force.y) {
      state.lastKnownState.axes[XBOXControls.AXIS.LEFTY] = force.y
      console.log("Y", state.lastKnownState.axes[XBOXControls.AXIS.LEFTY])
    }
  }
}

