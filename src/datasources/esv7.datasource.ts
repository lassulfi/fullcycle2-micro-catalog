import {inject, lifeCycleObserver, LifeCycleObserver} from '@loopback/core';
import {juggler} from '@loopback/repository';

const config = {
  name: 'esv7',
  connector: 'esv6',
  index: 'catalog',
  version: 7,
  debug: process.env.APP_ENV === 'dev',
  // defaultSize: '',
  configuration: {
    node: process.env.ELASTICSEARCH_HOST,
    requestTimeout: process.env.ELASTICSEARCH_REQUEST_TIMEOUT,
    pingTimeout: process.env.ELASTICSEARCH_PING_TIMEOUT
  },
  mappingProperties:  {
    docType: {
      type: "keyword"
    },
    id: {
      type: "keyword"
    },
    name: {
      type: "text",
      fields: {
        keyword: {
          type: "keyword",
          ignore_above: 256
        }
      }
    },
    description: {
      type: "text",
    },
    is_active: {
      type: "boolean"
    },
    type: {
      type: "byte"
    },
    created_at: {
      type: "date"
    },
    updated_at: {
      type: "date"
    }
  }
};

// Observe application's life cycle to disconnect the datasource when
// application is stopped. This allows the application to be shut down
// gracefully. The `stop()` method is inherited from `juggler.DataSource`.
// Learn more at https://loopback.io/doc/en/lb4/Life-cycle.html
@lifeCycleObserver('datasource')
export class Esv7DataSource extends juggler.DataSource
  implements LifeCycleObserver {
  static dataSourceName = 'esv7';
  static readonly defaultConfig = config;

  constructor(
    @inject('datasources.config.esv7', {optional: true})
    dsConfig: object = config,
  ) {
    super(dsConfig);
  }
}
