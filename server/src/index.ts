import 'dotenv/config';
import express, { Request, Response } from 'express';
import cors from 'cors';
import authRouter from './routes/auth.js';
import customersRouter from './routes/customers.js';
import employeesRouter from './routes/employees.js';
import adminRouter from './routes/admin.js';
import auditRouter from './routes/audit.js';
import searchRouter from './routes/search.js';

const app = express();
app.use(cors({ origin: '*'}));
app.use(express.json());

app.get('/health', (_req: Request, res: Response) => res.json({ ok: true }));
app.use('/api/auth', authRouter);
app.use('/api/customers', customersRouter);
app.use('/api/employees', employeesRouter);
app.use('/api/admin', adminRouter);
app.use('/api/audit', auditRouter);
app.use('/api/search', searchRouter);

const port = process.env.PORT || 8080;
app.listen(port, () => console.log(`API listening on :${port}`));
