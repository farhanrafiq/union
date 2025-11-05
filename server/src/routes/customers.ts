import { Router, Request, Response } from 'express';
import { prisma } from '../db';
import { requireAuth } from '../middleware/auth';
import { z } from 'zod';

const router = Router();
router.use(requireAuth);

router.get('/', async (req: any, res: Response) => {
  const { dealerId } = req.auth;
  const customers = await prisma.customer.findMany({ where: { dealerId }, orderBy: { createdAt: 'desc' } });
  res.json(customers);
});

const createSchema = z.object({
  type: z.enum(['PRIVATE','GOVERNMENT']),
  nameOrEntity: z.string().min(2),
  contactPerson: z.string().optional(),
  phone: z.string().length(10, 'Phone must be exactly 10 digits'),
  email: z.string().email(),
  officialId: z.string().min(4),
  address: z.string().min(3)
});

router.post('/', async (req: any, res: Response) => {
  const { dealerId } = req.auth;
  const parse = createSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: 'Invalid payload' });

  const exists = await prisma.customer.findFirst({ where: { dealerId, officialId: parse.data.officialId } });
  if (exists) return res.status(409).json({ error: 'Customer with this ID already exists' });

  const customer = await prisma.customer.create({ data: { dealerId, ...parse.data } });
  res.status(201).json(customer);
});

export default router;
