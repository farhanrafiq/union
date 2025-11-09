import 'dotenv/config';
import express, { Request, Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import authRouter from './routes/auth.js';
import customersRouter from './routes/customers.js';
import employeesRouter from './routes/employees.js';
import adminRouter from './routes/admin.js';
import auditRouter from './routes/audit.js';
import searchRouter from './routes/search.js';

const app = express();

// CORS - Allow all origins with credentials
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());

// Health check
app.get('/health', (_req: Request, res: Response) => res.json({ ok: true }));

// API routes
app.use('/api/auth', authRouter);
app.use('/api/customers', customersRouter);
app.use('/api/employees', employeesRouter);
app.use('/api/admin', adminRouter);
app.use('/api/audit', auditRouter);
app.use('/api/search', searchRouter);

// Serve frontend static files
const frontendPath = path.resolve(__dirname, '../../dist');
app.use(express.static(frontendPath));

// SPA fallback
app.get('*', (_req: Request, res: Response) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

const port = process.env.PORT || 10000;
app.listen(port, () => console.log(`Server running on port ${port}`));
