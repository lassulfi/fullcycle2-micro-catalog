import {injectable, /* inject, */ BindingScope, inject} from '@loopback/core';
import {getModelSchemaRef} from '@loopback/openapi-v3';
import {AjvFactory, RestBindings, validateRequestBody} from '@loopback/rest';

interface ValidateOptions<T> {
  data: any;
  entityClass: Function & {prototype: T};
}

@injectable({scope: BindingScope.SINGLETON})
export class ValidatorService {

  cache = new Map();

  constructor(
    @inject(RestBindings.AJV_FACTORY) private ajvFactory: AjvFactory
  ) {
  }

  async validate<T extends object>({data, entityClass}: ValidateOptions<T>) {
    const modelSchema = getModelSchemaRef(entityClass);
    if (!modelSchema) {
      const error = new Error('The parameter entityClass is not an entity');
      error.name = 'NotEntityClass';

      throw error;
    }

    const schemaRef = {$ref: modelSchema.$ref};
    const schemaName = Object.keys(modelSchema.definitions)[0];

    if (!this.cache.has(schemaName)) {
      this.cache.set(schemaName, modelSchema.definitions[schemaName]);
    }

    const globalSchemas = Array.from(this.cache).reduce<any>(
      (obj, [key, value]) => {
        obj[key] = value;
        return obj;
      },
      {}
    );

    await validateRequestBody(
      {value: data, schema: schemaRef},
      {required: true, content: {}},
      globalSchemas,
      {
        ajvFactory: this.ajvFactory
      }
    );
  }
}
