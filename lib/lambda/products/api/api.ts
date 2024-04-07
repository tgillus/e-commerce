import { Effect } from 'effect';
import { RequestParams } from '../../common/request/request-params.js';
import { Response } from '../../common/response/response.js';
import { OpFactory } from '../application/operation/op-factory.js';
import { Operation } from '../application/operation/operation.js';

export class Api {
  constructor(private readonly operation: Operation) {}

  handler = async (params: RequestParams) =>
    Response.produce(await Effect.runPromiseExit(this.operation.exec(params)));

  static from = (params: RequestParams) => new Api(OpFactory.from(params));
}
