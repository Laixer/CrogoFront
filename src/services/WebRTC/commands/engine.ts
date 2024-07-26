/******************************************************************************
 * Engine
 */
export enum EngineState {
  NOREQUEST = 0x0,
  STARTING = 0x01,
  STOPPING = 0x02,
  REQUEST = 0x10
}

export class Engine {
  driver_demand: number
  actual_engine: number
  rpm: number
  state: EngineState

  constructor(driver_demand: number, actual_engine: number, rpm: number, state: EngineState) {
    this.driver_demand = driver_demand
    this.actual_engine = actual_engine
    this.rpm = rpm
    this.state = state
  }

  static request_rpm(rpm: number): Engine {
    return new Engine(0, 0, rpm, EngineState.REQUEST)
  }

  static shutdown(): Engine {
    return new Engine(0, 0, 0, EngineState.NOREQUEST)
  }

  is_running(): boolean {
    return this.state === EngineState.REQUEST && (this.actual_engine > 0 || this.rpm > 0)
  }

  static fromBytes(data: ArrayBuffer): Engine {
    const dataView = new DataView(data)

    const driver_demand = dataView.getUint8(0)
    const actual_engine = dataView.getUint8(1)
    const rpm = dataView.getUint16(2, false)
    const state = dataView.getUint8(4)

    return new Engine(driver_demand, actual_engine, rpm, state)
  }

  toBytes(): ArrayBuffer {
    const buffer = new ArrayBuffer(5)
    const dataView = new DataView(buffer)

    dataView.setUint8(0, this.driver_demand)
    dataView.setUint8(1, this.actual_engine)
    dataView.setUint16(2, this.rpm, false)
    dataView.setUint8(4, this.state)

    return buffer
  }
}