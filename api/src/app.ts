import express, { Express, Request, Response } from 'express';
import {authRouter} from './router/auth.router';

const app: Express = express();

app.use(express.json());

app.get('/', (req: Request, res: Response) => {
	res.send('Hello world');
});

app.get('/', (req: Request, res: Response) => {
	res.send('Hello world');
});

app.use('/auth', authRouter);

export default app;
