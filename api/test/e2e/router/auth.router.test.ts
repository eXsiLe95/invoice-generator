import {afterEach, beforeEach, describe, expect, test} from 'vitest';
import database from "../../../src/database";

describe('API Auth Test', () => {

	const email: string = 'test@test.com';
	const password: string = 'password';

	beforeEach(async () => {
		await database.user.deleteMany();
	});

	test('creates a new user', async () => {
		const response = await fetch('http://localhost:3000/auth/register', {
			method: 'POST',
			headers: {
				'content-type': 'application/json',
			},
			body: JSON.stringify({email, password})
		});
		expect(response.status).toEqual(201);
		const responseBody = await response.json();
		expect(responseBody.email).toEqual(email);
		expect(responseBody.password).toBeUndefined();
	});

	test('fails to create a new user when email missing', async () => {
		const response = await fetch('http://localhost:3000/auth/register', {
			method: 'POST',
			headers: {
				'content-type': 'application/json',
			},
			body: JSON.stringify({password})
		});
		expect(response.status).toEqual(400);
		const responseBody = await response.json();
		expect(responseBody.message).toEqual("email and password are mandatory");
	});

	test('fails to create a new user when password missing', async () => {
		const response = await fetch('http://localhost:3000/auth/register', {
			method: 'POST',
			headers: {
				'content-type': 'application/json',
			},
			body: JSON.stringify({email})
		});
		expect(response.status).toEqual(400);
		const responseBody = await response.json();
		expect(responseBody.message).toEqual("email and password are mandatory");
	});

	test('fails to create a new user when email already in use', async () => {
		await database.user.create({
			data: {
				email,
				password
			}
		});
		const user = await database.user.findFirst();
		expect(user).toBeDefined();
		expect(user.email).toEqual(email);
		const response = await fetch('http://localhost:3000/auth/register', {
			method: 'POST',
			headers: {
				'content-type': 'application/json',
			},
			body: JSON.stringify({email, password})
		});
		expect(response.status).toEqual(400);
		const responseBody = await response.json();
		expect(responseBody.message).toEqual("email address already in use");
	});

	afterEach(async () => {
		await database.user.deleteMany();
	})
});
