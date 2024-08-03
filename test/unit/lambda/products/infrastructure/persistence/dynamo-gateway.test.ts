import { ConfigProvider, Effect, Exit } from 'effect';
import assert from 'node:assert';
import * as td from 'testdouble';
import { afterEach, beforeEach, expect, test } from 'vitest';
import {
  DynamoClient,
  DynamoClientTest,
} from '../../../../../../lib/lambda/common/vendor/dynamo/dynamo-client.js';
import { ProductDto } from '../../../../../../lib/lambda/products/domain/dto/product-dto.js';
import {
  DynamoGateway,
  DynamoGatewayLive,
} from '../../../../../../lib/lambda/products/infrastructure/persistence/dynamo-gateway.js';
import { ProductMapperLive } from '../../../../../../lib/lambda/products/infrastructure/persistence/product-mapper.js';
import { Time } from '../../../../../../lib/vendor/type/time.js';

const configProvider = ConfigProvider.fromMap(
  new Map([['PRODUCTS_TABLE_NAME', 'foo']])
);
const now = new Date();
const product = new ProductDto(
  {
    description: 'bar',
    name: 'baz',
    price: '9.99',
  },
  'qux',
  now
);

beforeEach(() => {
  td.replace(DynamoClient, 'build');
  td.replace(Time, 'now');
});

afterEach(() => {
  td.reset();
});

test('builds a dynamo gateway', async () => {
  td.when(DynamoClient.build()).thenReturn(DynamoClientTest);
  const dynamoGateway = DynamoGateway.build();
  const program = Effect.gen(function* () {
    const dynamoGateway = yield* DynamoGateway;
    return yield* dynamoGateway.create(product);
  });
  const runnable = program.pipe(
    Effect.provide(dynamoGateway),
    Effect.withConfigProvider(configProvider)
  );

  assert.deepStrictEqual(await Effect.runPromiseExit(runnable), Exit.void);
});

test('saves products to dynamo', async () => {
  const program = Effect.gen(function* () {
    const dynamoGateway = yield* DynamoGateway;
    return yield* dynamoGateway.create(product);
  });
  const runnable = program.pipe(
    Effect.provide(DynamoGatewayLive),
    Effect.provide(DynamoClientTest),
    Effect.provide(ProductMapperLive),
    Effect.withConfigProvider(configProvider)
  );

  assert.deepStrictEqual(await Effect.runPromiseExit(runnable), Exit.void);
});

test('retrieves products from dynamo', async () => {
  td.when(Time.now()).thenReturn(now);
  const productId = 'bar';
  const program = Effect.gen(function* () {
    const dynamoGateway = yield* DynamoGateway;
    return yield* dynamoGateway.get(productId);
  });
  const runnable = program.pipe(
    Effect.provide(DynamoGatewayLive),
    Effect.provide(DynamoClientTest),
    Effect.provide(ProductMapperLive),
    Effect.withConfigProvider(configProvider)
  );

  expect(await Effect.runPromise(runnable)).toEqual(
    new ProductDto(
      {
        description: 'foo',
        name: 'baz',
        price: '9.99',
      },
      'bar',
      now
    )
  );
});
