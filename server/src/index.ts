import 'dotenv/config';
import express, { Request, Response } from 'express';
import cors from 'cors';
import authRouter from './routes/auth';
import customersRouter from './routes/customers';

const app = express();
app.use(cors({ origin: '*'}));
app.use(express.json());

app.get('/health', (_req: Request, res: Response) => res.json({ ok: true }));
app.use('/api/auth', authRouter);
app.use('/api/customers', customersRouter);

const port = process.env.PORT || 8080;
app.listen(port, () => console.log(`API listening on :${port}`));
