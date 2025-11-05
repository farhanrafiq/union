import { Router, Request, Response } from 'express';
import { prisma } from '../db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

const router = Router();
const loginSchema = z.object({ username: z.string(), password: z.string() });

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

export default router;
