import type { APIGatewayProxyResult } from 'aws-lambda';
import { Context, Effect, Layer, Match, flow } from 'effect';
import type { RequestParams } from '../../common/request/request-params.js';
import { Response } from '../../common/response/response.js';
import { Operation } from '../application/operation/operation.js';

// biome-ignore lint/complexity/noStaticOnlyClass: <explanation>
export class Api extends Context.Tag('Api')<
  Api,
  {
    handler: (params: RequestParams) => Effect.Effect<APIGatewayProxyResult>;
  }
>() {
  static from = (params: RequestParams) =>
    ApiLive.pipe(Layer.provide(Operation.from(params)));
}

export const ApiLive = Layer.effect(
  Api,
  Effect.gen(function* (_) {
    const operation = yield* _(Operation);

    return {
      handler: (params) =>
        operation.exec(params).pipe(
          Effect.match({
            onFailure: flow(
              Match.value,
              Match.tags({
                InvalidOperationError: Response.fail,
                ServiceError: Response.fail,
                ValidationError: Response.fail,
              }),
              Match.exhaustive
            ),
            onSuccess: Response.success,
          })
        ),
    };
  })
);
