import {Entity, model, property} from '@loopback/repository';

export enum CastMemberTypes {
  TYPE_DIRECTOR = 1,
  TYPE_ACTOR = 2
}

@model()
export class CastMember extends Entity {
  @property({
    type: 'string',
    id: true,
    generated: false,
    required: true,
  })
  id: string;

  @property({
    type: 'string',
    required: true,
  })
  name: string;

  @property({
    type: 'number',
    required: true,
  })
  type: number;

  @property({
    type: 'date',
    required: true
  })
  created_at: string;

  @property({
    type: 'date',
    required: true
  })
  updated_at: string;

  constructor(data?: Partial<CastMember>) {
    super(data);
  }
}

export interface CastMemberRelations {
  // describe navigational properties here
}

export type CastMemberWithRelations = CastMember & CastMemberRelations;
