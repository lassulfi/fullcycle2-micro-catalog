import {injectable, /* inject, */ BindingScope} from '@loopback/core';
import {rabbitmqSubscribe} from '../decorators';

@injectable({scope: BindingScope.TRANSIENT})
export class CategorySyncService {
  constructor(/* Add @inject to inject parameters */) {}

  @rabbitmqSubscribe({
    exchange: 'amq.topic',
    queue: 'x',
    routingKey: 'model.category.*'
  })
  handler() {

  }
}
