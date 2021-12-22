import {Binding, Context, inject, MetadataInspector} from '@loopback/context';
import {Application, CoreBindings, Server} from '@loopback/core';
import {AmqpConnectionManager, AmqpConnectionManagerOptions, ChannelWrapper, connect} from 'amqp-connection-manager';
import {Channel, ConfirmChannel, Message, Options} from 'amqplib';
import {RabbitmqSubscribeMetadata, RABBITMQ_SUBSCRIBE_DECORATOR} from '../decorators';
import {RabbitmqBindings} from '../keys';

export enum ResponseEnum {
  ACK,
  REQUEUE,
  NACK
}

export interface RabbitmqConfig {
  uri: string;
  connOptions?: AmqpConnectionManagerOptions;
  exchanges?: {name: string; type: string; options?: Options.AssertExchange}[];
  queues?: {name: string; exchange?: {name: string; routingKey: string}; options?: Options.AssertQueue}[]
  defaultHandlerError?: ResponseEnum;

}

export class RabbitmqServer extends Context implements Server {
  private _listening: boolean;
  private _conn: AmqpConnectionManager;
  private _channelManager: ChannelWrapper;
  channel: Channel;

  constructor(
    @inject(CoreBindings.APPLICATION_INSTANCE) public app: Application,
    @inject(RabbitmqBindings.CONFIG) private config: RabbitmqConfig
  ) {
    super(app);
  }

  async start(): Promise<void> {
    this._conn = connect([this.config.uri], this.config.connOptions);
    this._channelManager = this.conn.createChannel();
    this._channelManager.on('connect', () => {
      this._listening = true;
      console.log('Successfully connected a RabbitMQ channel');
    });
    this._channelManager.on('error', (err, {name}) => {
      this._listening = false;
      console.error(`Failed to setup RabbitMQ channel name: ${name} | error: ${err.message}`)
    });
    await this.setupExchanges();
    await this.setupQueues();
    await this.bindSubscribers();
  }

  private async setupExchanges() {
    return this.channelManager.addSetup(async (channel: ConfirmChannel) => {
      if (!this.config.exchanges) {
        return;
      }

      await Promise.all(this.config.exchanges.map((exchange) => (
        channel.assertExchange(exchange.name, exchange.type, exchange.options)
      )));
    });
  }

  private async setupQueues() {
    return this.channelManager.addSetup(async (channel: ConfirmChannel) => {
      if (!this.config.queues) {
        return;
      }

      await Promise.all(this.config.queues.map(async (queue) => {
        await channel.assertQueue(queue.name, queue.options);
        if (!queue.exchange) {
          return;
        }
        await channel.bindQueue(queue.name, queue.exchange.name, queue.exchange.routingKey);
      }));
    });
  }

  private async bindSubscribers() {
    this
      .getSubscribers()
      .map(async (item: {method: Function, metadata: RabbitmqSubscribeMetadata}) => {
        await this.channelManager.addSetup(async (channel: ConfirmChannel) => {
          const {exchange, queue, routingKey, queueOptions} = item.metadata;
          const assertQueue = await channel.assertQueue(
            queue ?? '',
            queueOptions ?? undefined
          );

          const routingKeys = Array.isArray(routingKey) ? routingKey : [routingKey];

          await Promise.all(
            routingKeys.map(key => channel.bindQueue(assertQueue.queue, exchange, key))
          );

          await this.consume({
            channel,
            queue: assertQueue.queue,
            method: item.method
          });
        });
      });
  }

  private getSubscribers(): {method: Function, metadata: RabbitmqSubscribeMetadata}[] {
    const bindings: Array<Readonly<Binding>> = this.find('services.*');

    return bindings
    .map(
      binding => {
        const metadata = MetadataInspector.getAllMethodMetadata<RabbitmqSubscribeMetadata>(
          RABBITMQ_SUBSCRIBE_DECORATOR, binding.source?.value.prototype
        );
        if (!metadata) {
          return [];
        }

        const methods = [];
        for (const methodName in metadata) {
          if (!Object.prototype.hasOwnProperty.call(metadata, methodName)) {
            return;
          }
          const service = this.getSync(binding.key) as any;
          methods.push({
            method: service[methodName].bind(service),
            metadata: metadata[methodName],
          });
        }

        return methods;
      }
    )
    .reduce((collection: any, item: any) => {
      collection.push(...item);
      return collection;
    }, []);
  }

  private async consume({channel, queue, method}: {channel: ConfirmChannel, queue: string, method: Function}): Promise<void> {
    await channel.consume(queue, async message => {
      try {
        if(!message) {
          throw new Error('Received null message');
        }

        const content = message.content;
        if (content) {
          let data;
          try {
            data = JSON.parse(content.toString());
          } catch (error) {
            data = null;
          }
          const responseType = await method({data, message, channel});
          this.dispatchResponse(channel, message, responseType);
        }
      } catch (error) {
        console.error(error);
        if(!message) {
          return;
        }
        this.dispatchResponse(channel, message, this.config?.defaultHandlerError);
      }
    });
  }

  private dispatchResponse(channel: Channel, message: Message, responseType?: ResponseEnum) {
    switch (responseType) {
      case ResponseEnum.REQUEUE:
        channel.nack(message, false, true);
        break;
      case ResponseEnum.NACK:
        channel.nack(message, false, false);
        break;
      case ResponseEnum.ACK:
      default:
        channel.ack(message);
    }
  }

  async stop(): Promise<void> {
    await this.conn.close();
    this._listening = false;
  }

  get listening(): boolean {
    return this._listening;
  }

  get conn(): AmqpConnectionManager {
    return this._conn;
  }

  get channelManager(): ChannelWrapper {
    return this._channelManager;
  }
}
