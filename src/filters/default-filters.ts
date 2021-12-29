import {AnyObject, Filter, FilterBuilder, Where, WhereBuilder} from '@loopback/repository';
import {clone} from 'lodash';

export abstract class DefaultFilter<MT extends object = AnyObject> extends
  FilterBuilder<MT> {
  defaultFilter: Filter<MT> | null;

  constructor(filter?: Filter<MT>) {
    super(filter);
    const defaultFilter = this.applyDefaultFilter();
    this.defaultFilter = defaultFilter ? clone(defaultFilter.filter) : null;
  }

  protected applyDefaultFilter(): DefaultFilter<MT> | void {}

  isActive() {
    this.filter.where = new WhereBuilder<{is_active: boolean}>(
      this.filter.where,
    )
      .eq('is_active', true)
      .build() as Where<MT>;
    return this;
  }

  build() {
    return this.defaultFilter ? this.impose(this.defaultFilter).filter : this.filter;
  }
}
