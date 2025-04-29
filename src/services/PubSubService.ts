export interface ChannelDefaults {
  description?: string
  log?: boolean
  group?: string
  subscriptions?: Function[]
}

export interface Channel {
  // The identifier used to subscribe to & emit messages on
  identifier: string | number

  // An optional description
  description?: string

  // Whether to pass
  log?: boolean

  // Subscriptions
  subcriptions?: Function[]
}

export interface PubSubOptions {
  logToConsole?: boolean
  channelDefaults?: ChannelDefaults
}

export class PubSubEvent extends Event { }

export class PubSub {
  /**
   * Default options for new channels, can be set
   */
  channelDefaults = {
    desciption: 'No description available',
    subcriptions: [],
    log: !!((import.meta.env.VITE_PUBSUBSERVICE_LOG || 'false').toLocaleLowerCase() === 'true')
  }

  /**
   * The registered channels
   */
  channels: Record<string | number, Channel> = {}

  /****************************************************************************
   * Constructor
   */
  constructor(
    options: PubSubOptions = {
      logToConsole: true
    }
  ) {
    // register the internal logging channel
    this.registerChannel({
      identifier: 'internal.log',
      description: 'A channel that can be used to log events on channels that have logging enabled',
      log: false
    })

    // by default the internal logging channel outputs to the console
    if (!!options.logToConsole) {
      this.subscribe('internal.log', (event: PubSubEvent) => console.log(event))
    }

    // allow default options for new channels to be specified
    if (options.channelDefaults) {
      this.setChannelDefaults(options.channelDefaults)
    }

    this.emit('internal.log', new PubSubEvent('PubSubService has been initiated'))
  }

  /****************************************************************************
   * Channels
   */

  /**
   * Allows channel defaults to be changed
   */
  setChannelDefaults(channelDefaults: ChannelDefaults): PubSub {
    this.channelDefaults = Object.assign(this.channelDefaults, channelDefaults)

    return this
  }

  /**
   * Whether a channel exists
   */
  hasChannel(identifier: string | number) {
    return !!this.channels[identifier]
  }

  /**
   * Check whether the channel has a parent channel
   */
  hasParentChannel(identifier: string | number) {
    return typeof identifier === 'string' && identifier.split('.').length !== 1
  }

  /**
   * Get the parent channel identifier from a child channel
   * or return false if the channel has no parent
   */
  getParentChannelIdentifier(identifier: string | number): string | false {
    if (typeof identifier === 'string' && this.hasParentChannel(identifier)) {
      return identifier.split('.').slice(0, -1).join('.')
    }
    return false
  }

  /**
   * Remove '.*' from the end of the identifier
   */
  cleanChannelIdentifier(identifier: string | number): string | number {
    if (typeof identifier === 'string' && identifier.endsWith('.*')) {
      return identifier.split('.').slice(0, -1).join('.')
    }
    return identifier
  }

  /**
   * Register a channel
   */
  registerChannel(channel: Channel, silent: boolean = false): PubSub {
    if (!channel.identifier) {
      throw new Error('A channel requires an identifier')
    }

    channel.identifier = this.cleanChannelIdentifier(channel.identifier)

    if (this.hasChannel(channel.identifier)) {
      // silently ignore repeat attempts at registering this channel
      if (silent) {
        return this
      }
      throw new Error('Channel is already registered')
    }

    // Use defaults if information was missing
    channel.description = channel.description || this.channelDefaults.desciption

    if (channel.log !== true && channel.log !== false) {
      channel.log = !!this.channelDefaults.log
    }

    // Slice to avoid spilling of subscriptions between channels
    channel.subcriptions = (channel.subcriptions || this.channelDefaults.subcriptions).slice()

    if (!Array.isArray(channel.subcriptions)) {
      throw new Error('Channel subscriptions need to be an empty array or an array of Functions')
    }

    // Add to the available channels
    this.channels[channel.identifier] = channel

    // If this is a nested channel we should perhaps also create the parent (e.g. the parent of 'gamepad.button' is 'gamepad')
    if (this.hasParentChannel(channel.identifier)) {
      const parentIdentifier = this.getParentChannelIdentifier(channel.identifier)
      if (parentIdentifier && !this.hasChannel(parentIdentifier)) {
        this.registerChannel({
          identifier: parentIdentifier,
          log: channel.log
        })
      }
    }

    // Do some logging
    if (this.channels[channel.identifier].log) {
      this.emit(
        'internal.log',
        new PubSubEvent(`Channel: ${channel.identifier} - channel registered`)
      )

      if (this.channels[channel.identifier].subcriptions?.length !== 0) {
        this.emit(
          'internal.log',
          new PubSubEvent(
            `Channel: ${channel.identifier} - added ${this.channels[channel.identifier].subcriptions?.length} subscription(s)`
          )
        )
      }
    }

    return this
  }

  /**
   * Update a channel (e.g. turn logging on, or change the description)
   *  Does not allow subscriptions to be changed
   */
  updateChannelDetails(channel: Channel): PubSub {
    if (this.channels[channel.identifier]) {
      this.channels[channel.identifier] = Object.assign(
        this.channels[channel.identifier],
        channel,
        // Do not allow subscriptions to be updated through this method
        {
          subscriptions: (this.channels[channel.identifier].subcriptions || []).slice()
        }
      )
    } else {
      this.emit(
        'internal.log',
        new PubSubEvent(
          `Channel: ${channel?.identifier} - failed to update channel: unkown channel`
        )
      )
      throw new Error(`Unknown channel: ${channel?.identifier}`)
    }

    return this
  }

  /**
   * Remove a channel and all it's subscriptions
   *  TODO: What about the child channels?
   */
  removeChannel(identifier: keyof typeof this.channels) {
    identifier = this.cleanChannelIdentifier(identifier)
    if (this.channels[identifier]) {
      if (this.channels[identifier].log) {
        this.emit('internal.log', new PubSubEvent(`Channel: ${identifier} - channel removed`))
      }

      delete this.channels[identifier]
    }
  }

  /**
   * A list of registered Channels
   */
  listChannels(): Channel[] {
    return Object.values(this.channels)
  }

  /****************************************************************************
   * Subscriptions
   */

  /**
   * Add a subscription to one of the channels
   */
  subscribe(identifier: keyof typeof this.channels | null, handler: Function): Function {
    if (!identifier) {
      throw new Error('Identifier is required')
    }

    identifier = this.cleanChannelIdentifier(identifier)

    if (!this.channels[identifier]) {
      this.registerChannel({
        identifier
      })
    }

    // Verify that the handler is a Function
    // TODO: Support Async functions
    if ({}.toString.call(handler) !== '[object Function]') {
      this.emit(
        'internal.log',
        new PubSubEvent(`Channel: ${identifier} - failed to add a subscription`)
      )
      throw new Error(`Handler has to be a Function - ${identifier}`)
    }

    if (!this.channels[identifier]) {
      // We create it, but that may go wrong
      throw new Error(`Missing channel - ${identifier}`)
    }

    if (!Array.isArray(this.channels[identifier]?.subcriptions)) {
      throw new Error(`Channel corrupted - ${identifier}`)
    }

    // Whatever sillyness it takes to make TS happy...
    this?.channels?.[identifier]?.subcriptions?.push(handler)

    if (this.channels[identifier].log) {
      this.emit(
        'internal.log',
        new PubSubEvent(`Channel: ${identifier} - a subscription has been added`)
      )
    }

    return () => this.unsubscribe(identifier, handler)
  }

  /**
   * Remove a subscription from one of the channels
   */
  unsubscribe(identifier: keyof typeof this.channels | null, handler: Function): PubSub {
    if (!identifier) {
      throw new Error('Identifier is required')
    }

    identifier = this.cleanChannelIdentifier(identifier)

    if (!this.channels[identifier]) {
      this.registerChannel({
        identifier
      })
    }

    if (!this.channels[identifier]) {
      // We create it, but that may go wrong
      throw new Error(`Missing channel - ${identifier}`)
    }

    if (!Array.isArray(this.channels[identifier]?.subcriptions)) {
      throw new Error(`Channel corrupted - ${identifier}`)
    }

    this.channels[identifier].subcriptions = (this.channels[identifier]?.subcriptions || []).filter(
      (sub) => sub !== handler
    )

    if (this.channels[identifier].log) {
      this.emit(
        'internal.log',
        new PubSubEvent(`Channel: ${identifier} - a subscription has been removed`)
      )
    }

    return this
  }

  /**
   * Emit an event to all handlers over a channel
   */
  emit(
    identifier: keyof typeof this.channels,
    event: PubSubEvent,
    parent: boolean = false
  ): PubSub {
    if (!identifier) {
      this.emit(
        'internal.log',
        new PubSubEvent(`Channel: unknonwn - emitting an event without a channel reference`)
      )
      throw new Error('Identifier is required')
    }

    identifier = this.cleanChannelIdentifier(identifier)

    const channel = this.channels?.[identifier]
    if (!channel) {
      this.emit('internal.log', new PubSubEvent(`Channel: ${identifier} - Unknown channel`))
      return this
    }

    // Go over channel subscribers
    for (let handler of channel?.subcriptions || []) {
      handler(event)
    }

    // Go over group based subscribers
    if (this.hasParentChannel(identifier)) {
      const parentIdentifier = this.getParentChannelIdentifier(identifier)
      if (parentIdentifier) {
        this.emit(parentIdentifier, event, true)
      }
    }

    // The catch all channel
    if (parent === false && this.channels['*']) {
      for (let handler of this.channels['*']?.subcriptions || []) {
        handler(event)
      }
    }

    // Ignore the 'internal.log' identifier to avoid endless recursion
    // TODO: Include Event details
    if (
      identifier !== 'internal' &&
      identifier !== 'internal.log' &&
      this.channels?.[identifier]?.log
    ) {
      this.emit(
        'internal.log',
        new PubSubEvent(
          `Channel: ${identifier} - message sent to ${this.channels[identifier].subcriptions?.length} subscribers`
        )
      )
    }

    return this
  }
}

export const PubSubService = new PubSub()
