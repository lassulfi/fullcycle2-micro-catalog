import {Context} from '@loopback/context';
import {Server} from '@loopback/core';
import {Channel, connect, Connection, Replies} from 'amqplib';

export class RabbitmqServer extends Context implements Server {
  private _listening: boolean;
  conn: Connection;

  async start(): Promise<void> {
    this.conn = await connect({
      hostname: 'rabbitmq',
      username: 'admin',
      password: 'admin'
    });
    this._listening = true;
    this.boot();
  }

  async boot() {
    const channel: Channel = await this.conn.createChannel();
    const queue: Replies.AssertQueue = await channel.assertQueue('first-queue');
    const exchange: Replies.AssertExchange =
      await channel.assertExchange('amq.direct', 'direct');

    await channel.bindQueue(queue.queue, exchange.exchange, 'minha-routing-key');

    // const result = channel.sendToQueue('first-queue',
    //   Buffer.from('hello, world!'));
    // console.log(result);
    await channel.publish('amq.direct',
      'minha-routing-key',
      Buffer.from('publicado por routing key'));

    channel.consume(queue.queue, (message) => {
      console.log(message?.content.toString());
    });
  }

  async stop(): Promise<void> {
    await this.conn.close();
    this._listening = false;
  }

  get listening(): boolean {
    return this._listening;
  }
}
