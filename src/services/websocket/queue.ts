
// import { v4 as uuidv4 } from 'uuid'; 
import { isWebSocketConnectionAvailable, sendMessage } from '.';
import type { IWebSocketCommand } from './commands';


/**
 * Queue for web socket commands
 *  TODO: Make reactive
 */
const WebsocketQueue: IWebSocketCommand[] = []

export const addToQueue = function addToQueue(command: IWebSocketCommand, connectionId: number, send: boolean = true) {
  
  WebsocketQueue.push(command)

  // TODO: Remove after queue is reactive
  if (send === true) {
    sendQueuedCommands()
  }
}


/**
 * Recursive sending of unsent commands 
 *  // TODO: Implement retry logic (limit recursive loop)
 */
export const sendQueuedCommands = function sendQueuedCommands() {

  // Verify the connection
  if (! isWebSocketConnectionAvailable()) {
    console.error("Websocket - trying to send a message before establishing a connection")
    // TODO: Note: No recursion. Currently sending only occurs after a new command is added
    return 
  } 

  // Get the oldest command that has not yet been sent
  const command = WebsocketQueue
    .find((command: IWebSocketCommand) => command.status === 'new')

  // nothing to do
  if (command === undefined) return 

  // update the status of the command to avoid duplicate sending
  command.status = "sending"

  const success = sendMessage({
    id: command.id,
    jsonrpc: command.jsonrpc,
    method: command.method,
    params: command.params,
  })
  
  if (success) {
    command.status = 'sent'
  } else {
    // TODO: Retry 
    command.retry++
    command.status = 'failed' // TODO: set status after x retries
  }

  // TODO: remove after making the queue reactive
  sendQueuedCommands()
}

/**
 * Handle a websocket response
 */
export const handleResponseMessage = function handleResponseMessage(event: MessageEvent) {

  console.log('Websocket - raw', event)

  const message = JSON.parse(event.data);
  console.log("Websocket - received message", message.id, message)

  const command = WebsocketQueue
    .find((command: IWebSocketCommand) => command.id === message.id)

  if (command === undefined) {
    console.error("Websocket - unable to find command related to received message", message.id)
    return
  }

  command.status = 'handling'

  // TODO: Error handler - check for message.error 

  if (typeof command.handler === "function") {
    console.log("Websocket - proceeding to run message handler", message.id)
    command.handler(message)
  } else {
    console.log("Websocket - message has no handler", message.id)
  }
  
  command.status = 'handled'

  console.log("Websocket - message has been handled", message.id, message, command)
}

