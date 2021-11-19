import {injectable, /* inject, */ BindingScope} from '@loopback/core';
import {repository} from '@loopback/repository';
import {Message} from 'amqplib';
import {rabbitmqSubscribe} from '../decorators';
import {GenreRepository} from '../repositories';
import {BaseModelSyncService} from './base-model-sync.service';

@injectable({scope: BindingScope.TRANSIENT})
export class GenreSyncService extends BaseModelSyncService {
  constructor(@repository(GenreRepository) private repo: GenreRepository) {
    super();
  }

  /*
   * Add service methods here
   */
  @rabbitmqSubscribe({
    exchange: 'amq.topic',
    queue: 'micro-catalog/sync-videos/genre',
    routingKey: 'model.genre.*'
  })
  async handle({data, message}: {data: any, message: Message}) {
    await this.sync({
      repo: this.repo,
      data,
      message
    });
  }
}
