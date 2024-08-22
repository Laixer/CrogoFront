import { watch, type ShallowRef, shallowRef } from "vue";
import type { IWebSocketCommand } from "./commands";
import type WebSocketConnection from "./WebSocketConnection";


class WebSocketQueue { 
  

  connection: WebSocketConnection

  /**
   * A shallow ref only triggers reactivity when the array changes,
   *  not if the objects within the array change
   */
  queue: ShallowRef<IWebSocketCommand[]> = shallowRef([])


  constructor(connection: WebSocketConnection) {
    this.connection = connection

    watch(
      this.queue,
      this.queueWatcher
    )
  }

  queueMessage(command: IWebSocketCommand) {
    this.queue.value.push(command)
  }


  queueWatcher(queue: ShallowRef<IWebSocketCommand[]>) {
    // Send new commands
    queue.value
      .filter((command: IWebSocketCommand) => command.status === 'new')
      .forEach(command => {
        try {
          command.status = 'sending'

          const success = this.connection._send({
            id: command.id,
            jsonrpc: command.jsonrpc,
            method: command.method,
            params: command.params,
          })

          if (! success) {
            console.error('WebSocketQueue - command failed', command)
            throw new Error('WebSocketQueue - Failed')
          }

          command.status = 'sent'
        } catch(err) {

          command.retry++ 
          command.status = 'failed'
        }
      })
  }
}


export default WebSocketQueue