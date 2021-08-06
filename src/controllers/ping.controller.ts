import {inject} from '@loopback/core';
import {ClassDecoratorFactory, MetadataInspector} from '@loopback/metadata';
import {repository} from '@loopback/repository';
import {
  get, getModelSchemaRef, param, post, Request, requestBody, response,
  ResponseObject, RestBindings
} from '@loopback/rest';
import {Category} from '../models';
import {CategoryRepository} from '../repositories';

/**
 * OpenAPI response for ping()
 */
const PING_RESPONSE: ResponseObject = {
  description: 'Ping Response',
  content: {
    'application/json': {
      schema: {
        type: 'object',
        title: 'PingResponse',
        properties: {
          greeting: {type: 'string'},
          date: {type: 'string'},
          url: {type: 'string'},
          headers: {
            type: 'object',
            properties: {
              'Content-Type': {type: 'string'},
            },
            additionalProperties: true,
          },
        },
      },
    },
  },
};

interface MyClassMetaData {
  name: string;
}

function myClassDecorator(spec: MyClassMetaData): ClassDecorator {
  const factory = new ClassDecoratorFactory<MyClassMetaData>(
    'metadata-my-class-decorator',
    spec
  )

  return factory.create();
}

/**
 * A simple controller to bounce back http requests
 */
@myClassDecorator({name: 'code education'})
export class PingController {
  constructor(
    @inject(RestBindings.Http.REQUEST) private req: Request,
    @repository(CategoryRepository) private categoryRepo: CategoryRepository) {

     }

  // Map to `GET /ping`
  @get('/ping')
  @response(200, PING_RESPONSE)
  ping(): object {
    // Reply with a greeting, the current time, the url, and request headers
    return {
      greeting: 'Hello from LoopBack',
      date: new Date(),
      url: this.req.url,
      headers: Object.assign({}, this.req.headers),
    };
  }

  @get('/categories')
  index() {
    return this.categoryRepo.find();
  }

  @post('/categories')
  create(@requestBody({
    content: {
      'application/json': {
        schema: getModelSchemaRef(Category, {
          title: 'New Category'
        })
      }
    }
  }) category: Category) {

    return this.categoryRepo.create(category);
  }

  @get('/categories/{id}')
  show(@param.path.string('id') id: string) {
    return this.categoryRepo.findById(id);
  }

}
const meta = MetadataInspector.getClassMetadata<MyClassMetaData>(
  'metadata-my-class-decorator',
  PingController
);

console.log(meta);
