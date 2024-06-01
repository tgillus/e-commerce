import { Effect, Equal, Exit, Layer } from 'effect';
import * as td from 'testdouble';
import { afterEach, expect, test } from 'vitest';
import { RequestParams } from '../../../../../../lib/lambda/common/request/request-params.js';
import { DynamoClientLive } from '../../../../../../lib/lambda/common/vendor/dynamo/dynamo-client.js';
import type { CreateArgs } from '../../../../../../lib/lambda/products/application/operation/args/create-args.js';
import { Handler } from '../../../../../../lib/lambda/products/application/operation/handler/handler.js';
import {
  InvalidOperationLive,
  Operation,
  ValidOperationLive,
} from '../../../../../../lib/lambda/products/application/operation/operation.js';
import { Validator } from '../../../../../../lib/lambda/products/application/operation/validation/validator.js';
import { Probe } from '../../../../../../lib/lambda/products/application/probe/probe.js';
import { ProductServiceLive } from '../../../../../../lib/lambda/products/application/service/product-service.js';
import { DynamoGatewayLive } from '../../../../../../lib/lambda/products/infrastructure/persistence/dynamo-gateway.js';
import { ProductMapperLive } from '../../../../../../lib/lambda/products/infrastructure/persistence/product-mapper.js';

const params = td.object<RequestParams>();
const args = td.object<CreateArgs>();

const program = Effect.gen(function* (_) {
  const operation = yield* _(Operation);
  return yield* _(operation.exec(params));
});
const layer = Layer.succeed(Probe, {
  invalidRequestReceived: () => Effect.void,
  validRequestReceived: () => Effect.void,
  argsValidationSucceeded: () => Effect.void,
  argsValidationFailed: () => Effect.void,
  savingProductToDynamoSucceeded: () => Effect.void,
  savingProductToDynamoFailed: () => Effect.void,
});

afterEach(() => {
  td.reset();
});

test('executes invalid operations', () => {
  const operation = InvalidOperationLive.pipe(Layer.provide(layer));
  const runnable = Effect.provide(program, operation);

  const result = Effect.runSyncExit(runnable);

  expect(Exit.isSuccess(result)).toEqual(false);
  expect(result).toEqual(Exit.fail(new Error('Invalid operation')));
});

test('executes valid operations', () => {
  const validator = Layer.succeed(Validator, {
    validate: () => Effect.succeed(args),
  });
  const handler = Layer.succeed(Handler, {
    exec: () => Effect.succeed('foo'),
  });
  const operation = ValidOperationLive.pipe(
    Layer.provide(Layer.merge(validator, handler))
  ).pipe(Layer.provide(layer));
  const runnable = Effect.provide(program, operation);

  const result = Effect.runSyncExit(runnable);

  expect(Exit.isSuccess(result)).toEqual(true);
});

test('builds an invalid operation layer', () => {
  const params = new RequestParams({ body: 'foo', httpMethod: 'bar' });

  expect(Operation.from(params)).toEqual(InvalidOperationLive);
});

test.skip('builds an valid operation layer', () => {
  const params = new RequestParams({ body: 'foo', httpMethod: 'POST' });
  const layer = ValidOperationLive.pipe(
    Layer.provide(ProductServiceLive),
    Layer.provide(DynamoGatewayLive),
    Layer.provide(Layer.merge(DynamoClientLive, ProductMapperLive))
  );

  expect(Equal.equals(Operation.from(params), layer)).toEqual(true);
});
