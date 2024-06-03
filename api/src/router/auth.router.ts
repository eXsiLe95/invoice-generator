import express, {Request, Response, Router} from "express";
import database from "../database";
import {User} from "@prisma/client";
import bcrypt from "bcrypt";
import {auth, CustomRequest} from "../middleware/auth.middleware";
import jwt from "jsonwebtoken";

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

	router.post('/login', async (req: Request, res: Response) => {
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

			const token = jwt.sign({ id: foundUser.id.toString() }, process.env.JWT_SECRET as string || "invoice-generator");

			await database.user.update({
				where: {
					email
				},
				data: {
					token
				}
			})

			res.status(200).json({
				...foundUser,
				password: undefined,
				token
			});
		} catch (e) {
			console.error(e);
			return res.status(500).send();
		}
	});

	router.get('/me', auth, async (req: CustomRequest, res: Response) => {
		res.send(req.user);
	});

	router.post('/logout', auth, async (req: CustomRequest, res: Response) => {
		await database.user.update({
			where: {
				id: req.user!.id
			},
			data: {
				token: null
			}
		});

		res.status(200).send();
	});

	return router;
})();
