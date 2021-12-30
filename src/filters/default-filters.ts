import {AnyObject, Filter, FilterBuilder, JsonSchema, Model, Where, WhereBuilder} from '@loopback/repository';
import {getJsonSchema} from '@loopback/repository-json-schema';
import {clone} from 'lodash';

export abstract class DefaultFilter<MT extends object = AnyObject> extends
  FilterBuilder<MT> {
  defaultFilter: Filter<MT> | null;

  constructor(filter?: Filter<MT>) {
    super(filter);
    const defaultFilter = this.applyDefaultFilter();
    this.defaultFilter = defaultFilter ? clone(defaultFilter.filter) : null;
    this.filter = {};
  }

  protected applyDefaultFilter(): DefaultFilter<MT> | void {}

  isActive(modelCtor: typeof Model) {
    this.filter.where = new WhereBuilder<{is_active: boolean}>(
      this.filter.where,
    )
      .eq('is_active', true)
      .build() as Where<MT>;
    this.isActiveRelations(modelCtor);
    return this;
  }

  isActiveRelations(modelCtor: typeof Model) {
    const relations: string[] = Object.keys(modelCtor.definition.relations);

    if (!relations.length) {
      return this;
    }

    const schema = getJsonSchema(modelCtor);

    const relationsFiltered = relations.filter(r => {
      const jsonSchema = schema.properties?.[r] as JsonSchema;
      if (!jsonSchema ||
        (jsonSchema.type !== 'array' && jsonSchema.type !== 'object')) {
        return false;
      }

      const properties = (jsonSchema.items as any).properties || jsonSchema.properties;

      return Object.keys(properties).includes('is_active');
    });

    const whereStr = JSON.stringify(this.filter.where);

    const regex = new RegExp(
      `(${relationsFiltered.map(r => `${r}.*`).join('|')})`,
      'g',
    );

    const matches = whereStr.match(regex);

    if (!matches) {
      return this;
    }

    const fields = matches.map(m => {
      const relation = m.split('.')[0];
      return {
        [`${relation}.is_active`]: true
      }
    });

    this.filter.where = new WhereBuilder<{is_active: boolean}>(
      this.filter.where,
    )
      .and(fields)
      .build() as Where<MT>;
    return this;
  }

  build() {
    return this.defaultFilter ? this.impose(this.defaultFilter).filter : this.filter;
  }
}
