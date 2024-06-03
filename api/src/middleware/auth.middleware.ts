import {NextFunction, Request, Response} from "express";
import jwt from "jsonwebtoken";
import database from "../database";
import {User} from "@prisma/client";

export type CustomRequest = Request & {
	user?: Omit<User, 'password'> & {password: undefined},
	token?: string;
}

type DecodedToken = {
	id: string;
}

export const auth = async (req: CustomRequest, res: Response, next: NextFunction) => {
	try {
		const token = req.headers.authorization?.replace('Bearer ', '');

		if (!token) {
			throw new Error('No bearer token provided');
		}

		const decodedToken = jwt.verify(token, process.env.JWT_SECRET as string || "invoice-generator") as DecodedToken;

		const user = await database.user.findFirst({
			where: {
				id: decodedToken.id,
				// token: token
			}
		});

		if (!user) {
			throw new Error('User not found');
		}

		req.user = {
			...user,
			password: undefined
		};
		req.token = token;

		next();
	} catch (e: unknown) {
		res.status(401).json({
			status: 401,
			message: "Unauthorized",
		})
	}
}
