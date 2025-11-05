import { Router, Request, Response } from 'express';
import { prisma } from '../db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { verifyAdminPassword, generateAdminToken } from '../middleware/adminAuth';

const router = Router();
const loginSchema = z.object({ username: z.string(), password: z.string() });

// Admin login
router.post('/admin/login', async (req: Request, res: Response) => {
  const parse = loginSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: 'Invalid credentials' });

  const { password } = parse.data;
  if (!verifyAdminPassword(password)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = generateAdminToken();
  res.json({ token, admin: { id: 'admin-1', username: 'admin', role: 'admin' } });
});

router.post('/login', async (req: Request, res: Response) => {
  const parse = loginSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: 'Invalid credentials' });

  const { username, password } = parse.data;
  const dealer = await prisma.dealer.findUnique({ where: { username } });
  if (!dealer) return res.status(401).json({ error: 'Invalid credentials' });

  if (dealer.status !== 'ACTIVE') return res.status(403).json({ error: `Dealer ${dealer.status}` });

  const ok = await bcrypt.compare(password, dealer.passwordHash);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

  const token = jwt.sign({ dealerId: dealer.id, username: dealer.username }, process.env.JWT_SECRET || 'changeme', { expiresIn: '12h' });
  res.json({ token, dealer: { id: dealer.id, username: dealer.username, email: dealer.email, forcePasswordChange: dealer.forcePasswordChange } });
});

const forgotSchema = z.object({ username: z.string() });

const generateTempPassword = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
  let pwd = '';
  for (let i = 0; i < 12; i++) pwd += chars[Math.floor(Math.random() * chars.length)];
  return pwd;
};

// Dealer forgot password - sends temp (mock email via console)
router.post('/forgot', async (req: Request, res: Response) => {
  const parse = forgotSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ ok: true });

  const { username } = parse.data;
  const dealer = await prisma.dealer.findUnique({ where: { username } });

  // Always respond ok to avoid user enumeration
  if (!dealer) return res.json({ ok: true });
  if (dealer.status !== 'ACTIVE') return res.json({ ok: true });

  const temp = generateTempPassword();
  const passwordHash = await bcrypt.hash(temp, 10);
  await prisma.dealer.update({ where: { id: dealer.id }, data: { passwordHash, forcePasswordChange: true } });

  // Mock email
  console.log(`[MAIL] To: ${dealer.email} | Subject: Password Reset | Temp Password: ${temp}`);
  res.json({ ok: true });
});

// Change password (must be authenticated)
const changeSchema = z.object({ newPassword: z.string().min(6) });
router.post('/change-password', async (req: Request, res: Response) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  let payload: any;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET || 'changeme') as { dealerId: string };
  } catch {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const parse = changeSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: 'Invalid payload' });
  const passwordHash = await bcrypt.hash(parse.data.newPassword, 10);
  await prisma.dealer.update({ where: { id: payload.dealerId }, data: { passwordHash, forcePasswordChange: false } });
  res.json({ ok: true });
});

export default router;
