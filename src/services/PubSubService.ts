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

  // An optional group to which the channel belongs (e.g. Gamepad)
  group?: string

  // Whether to pass
  log?: boolean

  // Subscriptions
  subcriptions?: Function[]
}

export interface PubSubOptions {
  logToConsole?: boolean
  channelDefaults?: ChannelDefaults
}

export class PubSubEvent extends Event {}

export class PubSub {
  /**
   * Default options for new channels, can be set
   */
  channelDefaults = {
    desciption: 'No description available',
    subcriptions: [],
    group: undefined,
    log: !!((import.meta.env.VITE_PUBSUBSERVICE_LOG || 'false').toLocaleLowerCase() === 'true')
  }

  /**
   * The registered channels
   */
  channels: Record<string | number, Channel> = {}

  /**
   * Subscriptions to a group of channels
   *  Registered separately because channels may be added / removed, making group subscriptions difficult
   */
  groupSubscriptions: Record<string | number, Function[]> = {}

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
      identifier: 'log',
      group: '_',
      description: 'A channel that can be used to log events on channels that have logging enabled',
      log: false
    })

    // by default the internal logging channel outputs to the console
    if (!!options.logToConsole) {
      this.subscribe('log', (event: PubSubEvent) => console.log(event))
    }

    // allow default options for new channels to be specified
    if (options.channelDefaults) {
      this.setChannelDefaults(options.channelDefaults)
    }
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
   * Register a channel
   */
  registerChannel(channel: Channel): PubSub {
    if (!channel.identifier) {
      throw new Error('A channel requires an identifier')
    }

    // Use defaults if information was missing
    channel.description = channel.description || this.channelDefaults.desciption

    // TODO: Use prefix separated by . as group if not set
    channel.group = channel.group || this.channelDefaults.group

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

    // Do some logging
    if (this.channels[channel.identifier].log) {
      this.emit('log', new PubSubEvent(`Channel - ${channel.identifier} - channel registered`))

      if (this.channels[channel.identifier].subcriptions?.length !== 0) {
        this.emit(
          'log',
          new PubSubEvent(
            `Channel - ${channel.identifier} - added ${this.channels[channel.identifier].subcriptions?.length} subscription(s)`
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
      throw new Error(`Unknown channel: ${channel?.identifier}`)
    }

    return this
  }

  /**
   * Remove a channel and all it's subscriptions
   */
  removeChannel(identifier: keyof typeof this.channels) {
    if (this.channels[identifier]) {
      if (this.channels[identifier].log) {
        this.emit('log', new PubSubEvent(`Channel - ${identifier} - channel removed`))
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
  subscribe(
    identifier: keyof typeof this.channels | null,
    handler: Function,
    group?: string
  ): Function {
    if ((identifier === null || identifier === '*') && group) {
      return this.subscribeToGroup(group, handler)
    }

    if (!identifier) {
      throw new Error('Identifier is required')
    }

    if (!this.channels[identifier]) {
      this.registerChannel({
        identifier,
        group
      })
    }

    // Verify that the handler is a Function
    // TODO: Support Async functions
    if ({}.toString.call(handler) !== '[object Function]') {
      this.emit('log', new PubSubEvent(`Channel - ${identifier} - failed to add a subscription`))
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
      this.emit('log', new PubSubEvent(`Channel - ${identifier} - a subscription has been added`))
    }

    return () => this.unsubscribe(identifier, handler)
  }

  /**
   * Remove a subscription from one of the channels
   */
  unsubscribe(
    identifier: keyof typeof this.channels | null,
    handler: Function,
    group?: string
  ): PubSub {
    if ((identifier === null || identifier === '*') && group) {
      return this.unsubscribeFromGroup(group, handler)
    }

    if (!identifier) {
      throw new Error('Identifier is required')
    }

    if (!this.channels[identifier]) {
      this.registerChannel({
        identifier,
        group
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
      this.emit('log', new PubSubEvent(`Channel - ${identifier} - a subscription has been removed`))
    }

    return this
  }

  /**
   * Emit an event to all handlers over a channel
   */
  emit(identifier: keyof typeof this.channels, event: PubSubEvent): PubSub {
    const channel = this.channels?.[identifier]
    if (!channel) {
      this.emit('log', new PubSubEvent(`Channel - ${identifier} - Unknown channel`))
      return this
    }

    // Go over channel subscribers
    for (let handler of channel?.subcriptions || []) {
      handler(event)
    }

    // Go over group based subscribers
    if (channel.group && this.groupSubscriptions[channel.group]) {
      for (let handler of this.groupSubscriptions[channel.group] || []) {
        handler(event)
      }
    }

    // The catch all channel
    if (this.channels['*']) {
      for (let handler of this.channels['*']?.subcriptions || []) {
        handler(event)
      }
    }

    // Ignore the 'log' identifier to avoid endless recursion
    // TODO: Include Event details
    if (identifier !== 'log' && this.channels?.[identifier]?.log) {
      this.emit(
        'log',
        new PubSubEvent(
          `Channel - ${identifier} - message sent to ${this.channels[identifier].subcriptions?.length} subscribers`
        )
      )
      if (channel.group && this.groupSubscriptions[channel.group]) {
        this.emit(
          'log',
          new PubSubEvent(
            `Channel - ${identifier} - message sent to ${this.groupSubscriptions[channel.group]?.length} group subscribers`
          )
        )
      }
    }
    return this
  }

  /****************************************************************************
   * Group Subscriptions
   */

  /**
   * Add a group based subscription (receives all messages from any channel in the specified group)
   */
  subscribeToGroup(group: string, handler: Function): Function {
    this.groupSubscriptions[group] = this.groupSubscriptions[group] || []

    // TODO: Support Async functions
    if ({}.toString.call(handler) !== '[object Function]') {
      this.emit('log', new PubSubEvent(`Group - ${group} - failed to add a subscription`))
      throw new Error(`Handler has to be a Function - ${group}`)
    }

    this.groupSubscriptions[group].push(handler)

    this.emit('log', new PubSubEvent(`Group - ${group} - Added group subscription`))

    return () => this.unsubscribeFromGroup(group, handler)
  }

  /**
   * Remove a group based subscription
   */
  unsubscribeFromGroup(group: string, handler: Function): PubSub {
    this.groupSubscriptions[group] = (this.groupSubscriptions[group] || []).filter(
      (sub) => sub !== handler
    )

    this.emit('log', new PubSubEvent(`Group - ${group} - Removed group subscription`))

    return this
  }
}

export const PubSubService = new PubSub()
