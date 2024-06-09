import express, { Request, Response, Router } from 'express';
import database from '../database';
import { User } from '@prisma/client';
import bcrypt from 'bcrypt';
import { auth, CustomRequest } from '../middleware/auth.middleware';
import jwt from 'jsonwebtoken';

export const authRouter: Router = (() => {
	const router = express.Router();

	router.post('/register', async (req: Request, res: Response) => {
		const user: Partial<User> = req.body;

		const { email, password } = user;

		if (!email || !password) {
			return res.status(400).json({
				status: 400,
				message: 'email and password are mandatory',
			});
		}

		try {
			const isEmailAlreadyInUse =
				(await database.user.count({
					where: { email },
				})) > 0;

			if (isEmailAlreadyInUse) {
				return res.status(400).json({
					status: 400,
					message: 'email address already in use',
				});
			}

			const newUser = await database.user.create({
				data: {
					email,
					password: await bcrypt.hash(password, 10),
				},
				select: {
					id: true,
					email: true,
				},
			});

			res.status(201).json({
				...newUser,
				password: undefined,
			});
		} catch (e) {
			// eslint-disable-next-line no-console
			console.error(e);
			return res.status(500).send();
		}
	});

	router.post('/login', async (req: Request, res: Response) => {
		const loginInformation: { email: string; password: string } = req.body;

		const { email, password } = loginInformation;

		if (!email || !password) {
			return res.status(400).json({
				status: 400,
				message: 'email and password are mandatory',
			});
		}

		try {
			const foundUser = await database.user.findUnique({
				where: { email },
			});

			if (!foundUser || !(await bcrypt.compare(password, foundUser.password))) {
				return res.status(401).json({
					status: 401,
					message: 'email and password do not match',
				});
			}

			const token = jwt.sign(
				{ id: foundUser.id.toString() },
				(process.env.JWT_SECRET as string) || 'invoice-generator'
			);

			const loggedInUser = await database.user.update({
				where: {
					email,
				},
				data: {
					token,
				},
				select: {
					id: true,
					email: true,
				},
			});

			res.status(200).json({
				...loggedInUser,
				password: undefined,
				token,
			});
		} catch (e) {
			// eslint-disable-next-line no-console
			console.error(e);
			return res.status(500).send();
		}
	});

	router.get('/me', auth, async (req: CustomRequest, res: Response) => {
		res.send(req.user);
	});

	router.post('/logout', auth, async (req: CustomRequest, res: Response) => {
		try {
			await database.user.update({
				where: {
					id: req.user!.id,
				},
				data: {
					token: null,
				},
			});

			res.status(200).send();
		} catch (e) {
			// eslint-disable-next-line no-console
			console.error(e);
			return res.status(500).send();
		}
	});

	return router;
})();
