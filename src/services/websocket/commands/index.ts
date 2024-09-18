import { v4 as uuidv4 } from 'uuid'
import { getConnectionId } from '..'

export interface IWebSocketCommand {
  // message params
  jsonrpc: '2.0'
  method: string
  params: any[] // got to be flexible here

  // internal
  id: string // uuid
  connectionId: number | null // random generated number

  // TODO: enum
  status: 'new' | 'sending' | 'sent' | 'handling' | 'handled' | 'failed'
  retry: number

  // response handler
  handler: Function
}

export class WebSocketCommand implements IWebSocketCommand {
  // message params
  jsonrpc: '2.0' = '2.0'
  method: string = ''
  params: any[] = []

  // internal
  id: string
  connectionId: number | null = getConnectionId()

  status: 'new' | 'sending' | 'sent' | 'handling' | 'handled' | 'failed' = 'new'
  retry: number = 1

  // response handler
  handler: Function = () => {
    console.log('WebSocketCommand - message handled')
  }

  constructor() {
    this.id = uuidv4()
  }
}
