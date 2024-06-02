import express, {Request, Response, Router} from "express";
import database from "../database";
import {User} from "@prisma/client";
import bcrypt from "bcrypt";

export const authRouter: Router = (() => {
	const router = express.Router();

	router.post('/register', async (req: Request, res: Response) => {
		const user: Partial<User> = req.body;

		const {email, password} = user;

		if (!email || !password) {
			return res.status(400).json({
				status: 400,
				message: "email and password are mandatory",
			});
		}

		try {

			const isEmailAlreadyInUse = !!await database.user.findFirst({
				where: {email},
			});

			if (isEmailAlreadyInUse) {
				return res.status(400).json({
					status: 400,
					message: "email address already in use",
				});
			}

			const newUser = await database.user.create({
				data: {
					email,
					password: await bcrypt.hash(password, 10)
				}
			})

			res.status(201).json({
				...newUser,
				password: undefined,
			});
		} catch (e) {
			console.error(e);
			return res.status(500).send();
		}
	});

	router.post('/login', async (req, res) => {
		const user: Partial<User> = req.body;

		const {email, password} = user;

		if (!email || !password) {
			return res.status(400).json({
				status: 400,
				message: "email and password are mandatory",
			});
		}

		try {

			const foundUser = await database.user.findFirst({
				where: {email},
			});

			if (!foundUser || !await bcrypt.compare(password, foundUser.password)) {
				return res.status(401).json({
					status: 401,
					message: "email and password do not match",
				});
			}

			res.status(200).json({
				...foundUser,
				password: undefined,
			});
		} catch (e) {
			console.error(e);
			return res.status(500).send();
		}
	});

	router.get('/me', async (req, res) => {
		res.send(database.user.findMany())
	});

	router.post('/logout', async (req, res) => {

	});

	return router;
})();
