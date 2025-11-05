import { Router, Response } from 'express';
import { prisma } from '../db';
import { requireAuth } from '../middleware/auth';
import { z } from 'zod';

const router = Router();
router.use(requireAuth);

router.get('/', async (req: any, res: Response) => {
  const { dealerId } = req.auth;
  const employees = await prisma.employee.findMany({ where: { dealerId }, orderBy: { createdAt: 'desc' } });
  res.json(employees);
});

const createSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().min(6),
  email: z.string().email(),
  aadhar: z.string().min(6),
  position: z.string().min(1),
  hireDate: z.string().transform((s) => new Date(s))
});

router.post('/', async (req: any, res: Response) => {
  const { dealerId } = req.auth;
  const parse = createSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: 'Invalid payload' });

  // aadhar unique globally by schema; catch duplicate
  try {
    const emp = await prisma.employee.create({ data: { dealerId, ...parse.data } });
    res.status(201).json(emp);
  } catch (e: any) {
    if (e?.code === 'P2002') return res.status(409).json({ error: 'Employee with this Aadhar already exists' });
    throw e;
  }
});

const updateSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  phone: z.string().min(6).optional(),
  email: z.string().email().optional(),
  aadhar: z.string().min(6).optional(),
  position: z.string().min(1).optional(),
});

router.patch('/:id', async (req: any, res: Response) => {
  const { dealerId } = req.auth;
  const { id } = req.params as { id: string };
  const parse = updateSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: 'Invalid payload' });

  try {
    const updated = await prisma.employee.update({
      where: { id },
      data: { ...parse.data },
    });
    if (updated.dealerId !== dealerId) return res.status(403).json({ error: 'Forbidden' });
    res.json(updated);
  } catch (e: any) {
    if (e?.code === 'P2002') return res.status(409).json({ error: 'Employee with this Aadhar already exists' });
    return res.status(404).json({ error: 'Employee not found' });
  }
});

const terminateSchema = z.object({ reason: z.string().min(2), date: z.string().transform((s) => new Date(s)) });

router.post('/:id/terminate', async (req: any, res: Response) => {
  const { dealerId } = req.auth;
  const { id } = req.params as { id: string };
  const parse = terminateSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: 'Invalid payload' });

  const emp = await prisma.employee.findUnique({ where: { id } });
  if (!emp || emp.dealerId !== dealerId) return res.status(404).json({ error: 'Employee not found' });

  const updated = await prisma.employee.update({
    where: { id },
    data: { status: 'TERMINATED', terminationReason: parse.data.reason, terminationDate: parse.data.date },
  });
  res.json(updated);
});

export default router;
