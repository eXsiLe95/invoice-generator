import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import bcrypt from 'bcrypt';

import database from '../../../src/database';

describe('API Test /auth', () => {
	const email: string = 'test@test.com';
	const password: string = 'password';

	beforeEach(async () => {
		await database.user.deleteMany();
	});

	test('/register: creates a new user', async () => {
		// Given

		// When
		const response = await fetch('http://localhost:3000/auth/register', {
			method: 'POST',
			headers: {
				'content-type': 'application/json',
			},
			body: JSON.stringify({ email, password }),
		});

		// Then
		expect(response.status).toEqual(201);
		const responseBody = await response.json();
		expect(responseBody.email).toEqual(email);
		expect(responseBody.password).toBeUndefined();
	});

	test('/register: fails to create a new user when email missing', async () => {
		// Given

		// When
		const response = await fetch('http://localhost:3000/auth/register', {
			method: 'POST',
			headers: {
				'content-type': 'application/json',
			},
			body: JSON.stringify({ password }),
		});

		// Then
		expect(response.status).toEqual(400);
		const responseBody = await response.json();
		expect(responseBody.message).toEqual('email and password are mandatory');
	});

	test('/register: fails to create a new user when password missing', async () => {
		// Given

		// When
		const response = await fetch('http://localhost:3000/auth/register', {
			method: 'POST',
			headers: {
				'content-type': 'application/json',
			},
			body: JSON.stringify({ email }),
		});

		// Then
		expect(response.status).toEqual(400);
		const responseBody = await response.json();
		expect(responseBody.message).toEqual('email and password are mandatory');
	});

	test('/register: fails to create a new user when email already in use', async () => {
		// Given
		const user = await database.user.create({
			data: {
				email,
				password: await bcrypt.hash(password, 10),
			},
		});
		expect(user).toBeDefined();
		expect(user.email).toEqual(email);

		// When
		const response = await fetch('http://localhost:3000/auth/register', {
			method: 'POST',
			headers: {
				'content-type': 'application/json',
			},
			body: JSON.stringify({ email, password }),
		});

		// Then
		expect(response.status).toEqual(400);
		const responseBody = await response.json();
		expect(responseBody.message).toEqual('email address already in use');
	});

	test('/login: logs in existing user', async () => {
		// Given
		const user = await database.user.create({
			data: {
				email,
				password: await bcrypt.hash(password, 10),
			},
		});
		expect(user).toBeDefined();
		expect(user.email).toEqual(email);

		// When
		const response = await fetch('http://localhost:3000/auth/login', {
			method: 'POST',
			headers: {
				'content-type': 'application/json',
			},
			body: JSON.stringify({ email, password }),
		});

		// Then
		expect(response.status).toEqual(200);
	});

	test('/login: fails to log in non-existing user', async () => {
		// Given

		// When
		const response = await fetch('http://localhost:3000/auth/login', {
			method: 'POST',
			headers: {
				'content-type': 'application/json',
			},
			body: JSON.stringify({ email, password }),
		});

		// Then
		expect(response.status).toEqual(401);
		const responseBody = await response.json();
		expect(responseBody.message).toEqual('email and password do not match');
	});

	test('/login: fails to log in user with incorrect password', async () => {
		// Given
		const user = await database.user.create({
			data: {
				email,
				password: await bcrypt.hash(password, 10),
			},
		});
		expect(user).toBeDefined();
		expect(user.email).toEqual(email);

		// When
		const response = await fetch('http://localhost:3000/auth/login', {
			method: 'POST',
			headers: {
				'content-type': 'application/json',
			},
			body: JSON.stringify({ email, password: 'some-wrong-password' }),
		});

		// Then
		expect(response.status).toEqual(401);
		const responseBody = await response.json();
		expect(responseBody.message).toEqual('email and password do not match');
	});

	test('/login: fails to log in user with incorrect email', async () => {
		// Given
		const user = await database.user.create({
			data: {
				email,
				password: await bcrypt.hash(password, 10),
			},
		});
		expect(user).toBeDefined();
		expect(user.email).toEqual(email);

		// When
		const response = await fetch('http://localhost:3000/auth/login', {
			method: 'POST',
			headers: {
				'content-type': 'application/json',
			},
			body: JSON.stringify({ email: 'some-wrong-email@localhost', password }),
		});

		// Then
		expect(response.status).toEqual(401);
		const responseBody = await response.json();
		expect(responseBody.message).toEqual('email and password do not match');
	});

	test('/me: shows user data when logged in', async () => {
		// Given
		const user = await database.user.create({
			data: {
				email,
				password: await bcrypt.hash(password, 10),
			},
		});
		expect(user).toBeDefined();
		expect(user.email).toEqual(email);
		const loginResponse = await fetch('http://localhost:3000/auth/login', {
			method: 'POST',
			headers: {
				'content-type': 'application/json',
			},
			body: JSON.stringify({ email, password }),
		});
		expect(loginResponse.status).toEqual(200);
		const logineResponseBody = await loginResponse.json();
		expect(logineResponseBody.token).toMatch(/./g);
		const token = logineResponseBody.token;

		// When
		const response = await fetch('http://localhost:3000/auth/me', {
			headers: {
				Authorization: `Bearer ${token}`,
			},
		});

		// Then
		expect(response.status).toEqual(200);
		const responseBody = await response.json();
		expect(responseBody.email).toEqual(email);
		expect(responseBody.password).toBeUndefined();
	});

	test('/me: fails to show user data when not logged in', async () => {
		// Given

		// When
		const response = await fetch('http://localhost:3000/auth/me');

		// Then
		expect(response.status).toEqual(401);
	});

	test('/me: fails to show user data when token invalid', async () => {
		// Given
		const invalidToken =
			'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjRlYWM5YzQxLWI3M2UtNGJiZi05MDQyLTg2ZDBjY2I5MGUxNiIsImlhdCI' +
			'6MTcxNzM1MzQzMH0.XD1bRn5AD-Lzl6_8jrNVsfIEUQkP1E7B8jXoPF-XFu0';

		// When
		const response = await fetch('http://localhost:3000/auth/me', {
			headers: {
				Authorization: `Bearer ${invalidToken}`,
			},
		});

		// Then
		expect(response.status).toEqual(401);
	});

	test('/logout: logs out authenticated user', async () => {
		// Given
		const user = await database.user.create({
			data: {
				email,
				password: await bcrypt.hash(password, 10),
			},
		});
		expect(user).toBeDefined();
		expect(user.email).toEqual(email);
		const loginResponse = await fetch('http://localhost:3000/auth/login', {
			method: 'POST',
			headers: {
				'content-type': 'application/json',
			},
			body: JSON.stringify({ email, password }),
		});
		expect(loginResponse.status).toEqual(200);
		const logineResponseBody = await loginResponse.json();
		expect(logineResponseBody.token).toMatch(/./g);
		const token = logineResponseBody.token;
		const meResponse = await fetch('http://localhost:3000/auth/me', {
			headers: {
				Authorization: `Bearer ${token}`,
			},
		});
		expect(meResponse.status).toEqual(200);
		const meResponseBody = await meResponse.json();
		expect(meResponseBody.email).toEqual(email);
		expect(meResponseBody.password).toBeUndefined();

		// When
		const response = await fetch('http://localhost:3000/auth/logout', {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${token}`,
			},
		});

		// Then
		expect(response.status).toEqual(200);
		const meResponseAfterLogout = await fetch('http://localhost:3000/auth/me', {
			headers: {
				Authorization: `Bearer ${token}`,
			},
		});
		expect(meResponseAfterLogout.status).toEqual(401);
		const meResponseAfterLogoutBody = await meResponseAfterLogout.json();
		expect(meResponseAfterLogoutBody.status).toBe(401);
		expect(meResponseAfterLogoutBody.message).toBe('Unauthorized');
		const userAfterLogout = await database.user.findFirst({});
		expect(userAfterLogout).toBeDefined();
		expect(userAfterLogout.token).toBeNull();
	});

	afterEach(async () => {
		await database.user.deleteMany();
	});
});
