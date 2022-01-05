import {inject, lifeCycleObserver, LifeCycleObserver} from '@loopback/core';
import {juggler} from '@loopback/repository';
import {Client} from 'es6';
import dbConfig from './esv7.datasource.config';

// Observe application's life cycle to disconnect the datasource when
// application is stopped. This allows the application to be shut down
// gracefully. The `stop()` method is inherited from `juggler.DataSource`.
// Learn more at https://loopback.io/doc/en/lb4/Life-cycle.html
@lifeCycleObserver('datasource')
export class Esv7DataSource extends juggler.DataSource
  implements LifeCycleObserver {
  static dataSourceName = 'esv7';
  static readonly defaultConfig = dbConfig;

  constructor(
    @inject('datasources.config.esv7', {optional: true})
    dsConfig: object = dbConfig,
  ) {
    super(dsConfig);
  }

  public async deleteAllDocuments() {
    const index = (this as any).adapter.settings.index;

    const client: Client = (this as any).adapter.db;
    await client.delete_by_query({
      index,
      body: {
        query: {
          match_all: {}
        }
      }
    });
  }
}
