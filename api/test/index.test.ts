import { describe, expect, test } from 'vitest';
// eslint-disable-next-line @typescript-eslint/no-require-imports
import request = require('supertest');
import app from '../src/app';

describe('API Test', () => {
	test('server is running', async () => {
		const response = await request(app).get('/').send();
		expect(response.status).toEqual(200);
		expect(response.text).toEqual('Hello world');
	});
});
