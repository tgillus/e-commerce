import { expect, test } from 'vitest';
import { RequestParams } from '../../../../../../lib/lambda/common/request/request-params.js';
import { OpFactory } from '../../../../../../lib/lambda/products/application/operation/op-factory.js';
import {
  InvalidOperation,
  ValidOperation,
} from '../../../../../../lib/lambda/products/application/operation/operation.js';

test('create valid operation from post request', () => {
  const requestParams = new RequestParams({ body: 'foo', httpMethod: 'POST' });
  const operation = OpFactory.from(requestParams);

  expect(operation).toBeInstanceOf(ValidOperation);
});

test('create invalid operation from unhandled http method', () => {
  const requestParams = new RequestParams({ body: 'foo', httpMethod: 'bar' });
  const operation = OpFactory.from(requestParams);

  expect(operation).toBeInstanceOf(InvalidOperation);
});