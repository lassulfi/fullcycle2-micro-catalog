import {ApplicationConfig} from '.';

const config: ApplicationConfig = {
  rest: {
    port: +(process.env.PORT ?? 3000),
    host: process.env.HOST,
    // The `gracePeriodForClose` provides a graceful close for http/https
    // servers with keep-alive clients. The default value is `Infinity`
    // (don't force-close). If you want to immediately destroy all sockets
    // upon stop, set its value to `0`.
    // See https://www.npmjs.com/package/stoppable
    gracePeriodForClose: 5000, // 5 seconds
    openApiSpec: {
      // useful when used with OpenAPI-to-GraphQL to locate your application
      setServersFromRequest: true,
    },
  },
  rabbitmq: {
    uri: process.env.RABBITMQ_URI,
    defaultHandlerError: parseInt(process.env.RABBITMQ_HANDLER_ERROR ?? '0'),
    exchanges: [{name: 'dlx.amq.topic', type: 'topic'}],
    queues: [
      {
        name: 'dlx.sync-videos',
        exchange: {
          name: 'dlx.amq.topic',
          routingKey: 'model.*.*',
        },
        options: {
          deadLetterExchange: 'amq.topic',
          messageTTL: 20000,
        },
      },
    ],
  },
  jwt: {
    secret:
      '-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAiZmFM1Cbu+KrkN2SX1TFwDU+zZ9OApfQq09PukRWnYHlpQNWc9/WEO/ySl8NdhgCrcI+5W9ZZB43N3ZwJGRFmGNwVAuVz4SGufwB0gMAw384riQpQj48anLOaLFOL2NOi4OzV4N1DffHqV53wDM08tvnxwGBhLBYLZlv+Lj//6t7cEFrRDgJlK/npWs2RrPVAIzUus7kaNCHsbVvUbUEFS5iYaXQemV5vYriwskM1yhfJA9YCFvfxd7UtqWAOg2e1rwVslivxwuVJcJDR7ww60RJLUUvlXsUEjd84mBtwpk3V7SC4lWDgpuFKsMhlkyHTRuyCPRMiwhYzAg9jmUxtwIDAQAB\n-----END PUBLIC KEY-----',
  },
};

export default config;
