
import {radial, raw} from 'gamepad-api-mappings';

export enum Axis {
  'LEFTX' = 0,
  'LEFTY' = 1,
  'RIGHTX' = 2,
  'RIGHTY' = 3
}

// TODO: Add all buttons
// TODO: for ... in  issue with mixed enum key/values
export enum Button {
  'A' = 0,
  'B' = 1,
  'X' = 2,
  'Y' = 3
  // ... 15
}

export class ControllerEvent extends Event {}

export class AxisEvent extends ControllerEvent {
  axis: Axis
  value: number

  constructor(axis: Axis, value: number) {
    super('AxisEvent')

    this.axis = axis
    this.value = value
  }
}

export class ButtonEvent extends ControllerEvent {
  btn: Button
  pressed: boolean

  constructor(btn: Button, pressed: boolean) {
    super('ButtonEvent')

    this.btn = btn
    this.pressed = pressed
  }
}

class GamePadState {

  gamepad: Gamepad

  /**
   * Track the last known state so we can emit changes to the state
   */
  lastKnownState: {
    buttons: Record<number, boolean>,
    axes: Record<number, number>
  } = {
    buttons: {},
    axes: {}
  }

  constructor(gamepad: Gamepad) {
    this.gamepad = gamepad

    for (let btn in Object.keys(Button)) {
      console.log("btn init state...", btn, false)
      this.lastKnownState.buttons[btn] = false
    }
    
    for (let axis in Object.keys(Axis)) {
      console.log("axis init state...", axis, 0)
      this.lastKnownState.axes[axis] = 0
    }
  }
}


export class XBOXControls {

  /**
   * The axis deadzone 
   *  See: https://medium.com/@_Gaeel_/input-is-hard-deadzones-73426e9608d3
   */
  deadzone = 0.2
  
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
   * The subscription handlers
   */
  subscriptions: Record<'axis'|'btn', Function[]>  = {
    btn: [],
    axis: []
  }

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
    this.checkAxisState(gamepad.axes, this.connectedGamepads[gamepad.index].lastKnownState.axes)
  }

  /**
   * Detect changes in button states
   */
  checkButtonState(buttons: ReadonlyArray<GamepadButton>, buttonState: Record<string, boolean>) {
    for (let btn in Object.keys(Button)) {
      if (buttons[btn]?.pressed !== buttonState[btn]) {
        buttonState[btn] = buttons[btn]?.pressed

        // YaY for TS
        console.log("btn", btn, buttonState[btn])
        this.emit('btn', new ButtonEvent(Number(btn), buttonState[btn]))
      }
    }
  }
  
  /**
   * Detect change in axis. Uses 'gamepad-api-mappings' to avoid deadzone
   */
  checkAxisState(axes: ReadonlyArray<number>, axisState: Record<string, number>) {
    for(
      let set of [
        { x: Axis.LEFTX, y: Axis.LEFTY },
        { x: Axis.RIGHTX, y: Axis.RIGHTY }
      ]
    ) {
      const coord = {x: axes[set.x], y: axes[set.y]};
      let force = radial(coord, 0.2, raw);

      if (axisState[set.x] !== force.x) {
        axisState[set.x] = force.x
        this.emit('axis', new AxisEvent(Number(set.x), axisState[set.x]))
      } 

      if (axisState[set.y] !== force.y) {
        axisState[set.y] = force.y
        this.emit('axis', new AxisEvent(Number(set.y), axisState[set.y]))
      }
    }
  }

  /**
   * Add a subscription to one of the channels
   */
  subscribe(channel: 'btn'|'axis', handler: Function ) {
    this.subscriptions[channel].push(handler)
    return () => this.unssubscribe(channel, handler)
  }

  /**
   * Remove a subscription from one of the channels
   */
  unssubscribe(channel: 'btn'|'axis', handler: Function ) {
    this.subscriptions[channel] = this.subscriptions[channel].filter((sub) => sub !== handler)
  }

  /**
   * Emit an event to all handlers over a channel
   */
  emit(channel: 'btn'|'axis', event: ButtonEvent|AxisEvent) {
    for (let handler of this.subscriptions[channel]) {
      handler(event)
    }
  }
}

