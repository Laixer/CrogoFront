/**
 * Base command 
 */
export interface ICommand {
  type: 'command',
  topic: string,
  payload: object
}

export class Command implements ICommand {
  type: 'command' = 'command'

  topic: string = ''
  payload: object = {}
  
}