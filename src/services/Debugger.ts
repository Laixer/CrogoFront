export enum DebuggerLevels {
  DEBUG = 0,
  LOG = 1,
  INFO = 2,
  WARN = 3,
  ERROR = 5
}

class DebuggerClass {
  enabled: boolean

  level: DebuggerLevels

  constructor(enabled: boolean, level?: DebuggerLevels) {
    this.enabled = enabled

    this.level = level || DebuggerLevels.LOG
  }

  get debug() {
    if (this.level > DebuggerLevels.DEBUG) {
      return () => { }
    }

    return console.debug.bind(console)
  }

  get log() {
    if (this.level > DebuggerLevels.LOG) {
      return () => { }
    }

    return console.log.bind(console)
  }

  get info() {
    if (this.level > DebuggerLevels.INFO) {
      return () => { }
    }

    return console.info.bind(console)
  }

  get warn() {
    if (this.level > DebuggerLevels.WARN) {
      return () => { }
    }

    return console.warn.bind(console)
  }

  get error() {
    if (this.level > DebuggerLevels.ERROR) {
      return () => { }
    }

    return console.error.bind(console)
  }
}

const Debugger = new DebuggerClass(true, DebuggerLevels.LOG)

export default Debugger
