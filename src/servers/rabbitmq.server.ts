import {Context} from '@loopback/context';
import {Server} from '@loopback/core';
import {repository} from '@loopback/repository';
import {Channel, connect, Connection, Replies} from 'amqplib';
import {Category} from '../models';
import {CategoryRepository} from '../repositories';

export class RabbitmqServer extends Context implements Server {
  private _listening: boolean;
  conn: Connection;
  channel: Channel;

  constructor(@repository(CategoryRepository) private categoryRepo: CategoryRepository) {
    super();
    console.log(this.categoryRepo);
  }


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
    this.channel = await this.conn.createChannel();
    const queue: Replies.AssertQueue =
      await this.channel.assertQueue('micro-catalog/sync-videos');
    const exchange: Replies.AssertExchange =
      await this.channel.assertExchange('amq.topic', 'topic');

    await this.channel.bindQueue(queue.queue, exchange.exchange, 'model.*.*');

    await this.channel.consume(queue.queue, (message) => {
      if (!message) {
        return;
      }
      const data = JSON.parse(message.content.toString());
      const [model, event] = message.fields.routingKey.split('.').slice(1);
      this.sync({model, event, data})
        .then(() => this.channel.ack(message))
        .catch((error) => {
          console.error(error);
          this.channel.reject(message, false)
        });
      console.log(model, event);
    });
  }

  async sync({model, event, data}: {model: string, event: string, data: Category}) {
    if (model === 'category') {
      switch (event) {
        case 'created':
          await this.categoryRepo.create({
            ...data,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
          break;
        case 'updated':
          await this.categoryRepo.updateById(data.id, data);
          break;
        case 'deleted':
          await this.categoryRepo.deleteById(data.id);
          break;
      }
    }
  }

  async stop(): Promise<void> {
    await this.conn.close();
    this._listening = false;
  }

  get listening(): boolean {
    return this._listening;
  }
}
