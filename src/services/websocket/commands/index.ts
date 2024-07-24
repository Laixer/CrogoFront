import { v4 as uuidv4 } from 'uuid'; 

export interface IWebSocketCommand { 
  
  // message params
  jsonrpc: '2.0'
  method: string
  params: any[] // TODO: only strings ?

  // internal
  id: string // uuid
  status: "new" | "sending" | "sent" | "handling" | "handled" | "failed" 
  retry: number 

  // response handler
  handler: Function|null
}

export class WebSocketCommand implements IWebSocketCommand {

  // message params
  jsonrpc: "2.0" = "2.0"
  method: string = ''
  params: any[] = []

  // internal
  id: string
  status: "new" | "sending" | "sent" | "handling" | "handled" | "failed" = "new"
  retry: number = 1

  // response handler
  handler: Function | null = null

  constructor() {
    this.id = uuidv4()
  }
}
