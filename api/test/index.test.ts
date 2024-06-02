import { describe, expect, test } from 'vitest';

describe('API Test', () => {
	test('server is running', async () => {
		const response = await fetch('http://localhost:3000');
		expect(response.status).toEqual(200);
		expect(await response.text()).toEqual('Hello world');
	});
});
