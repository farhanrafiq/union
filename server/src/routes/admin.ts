import { Router, Request, Response } from 'express';
import { prisma } from '../db';
import { requireAdmin } from '../middleware/adminAuth';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const router = Router();
router.use(requireAdmin);

// Get all dealers
router.get('/dealers', async (req: Request, res: Response) => {
  const dealers = await prisma.dealer.findMany({ orderBy: { createdAt: 'desc' } });
  res.json(dealers);
});

// Create dealer
const createDealerSchema = z.object({
  username: z.string().min(3),
  email: z.string().email(),
  companyName: z.string().min(2),
  primaryContactName: z.string().min(2),
  primaryContactPhone: z.string().min(6),
  address: z.string().min(3),
});

router.post('/dealers', async (req: Request, res: Response) => {
  const parse = createDealerSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: 'Invalid payload' });

  const { username, email } = parse.data;
  
  // Check for duplicate username or email
  const existing = await prisma.dealer.findFirst({
    where: { OR: [{ username }, { email }] }
  });
  if (existing) {
    return res.status(409).json({ error: 'Username or email already exists' });
  }

  // Generate temp password
  const tempPassword = `temp_${Math.random().toString(36).slice(-8)}`;
  const passwordHash = await bcrypt.hash(tempPassword, 10);

  const dealer = await prisma.dealer.create({
    data: {
      ...parse.data,
      passwordHash,
      forcePasswordChange: true,
    }
  });

  // Log audit
  await prisma.auditLog.create({
    data: {
      userId: (req as any).admin.adminId,
      userName: 'Admin',
      actionType: 'CREATE_DEALER',
      details: `Created dealer ${dealer.companyName}`,
      ipAddress: req.ip || 'unknown',
    }
  });

  res.status(201).json({ dealer, tempPassword });
});

// Update dealer
const updateDealerSchema = z.object({
  companyName: z.string().min(2).optional(),
  primaryContactName: z.string().min(2).optional(),
  primaryContactPhone: z.string().min(6).optional(),
  address: z.string().min(3).optional(),
  email: z.string().email().optional(),
});

router.patch('/dealers/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const parse = updateDealerSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: 'Invalid payload' });

  try {
    const updated = await prisma.dealer.update({
      where: { id },
      data: parse.data,
    });

    await prisma.auditLog.create({
      data: {
        userId: (req as any).admin.adminId,
        userName: 'Admin',
        actionType: 'UPDATE_DEALER',
        details: `Updated dealer ${updated.companyName}`,
        ipAddress: req.ip || 'unknown',
      }
    });

    res.json(updated);
  } catch {
    res.status(404).json({ error: 'Dealer not found' });
  }
});

// Suspend dealer
const suspendSchema = z.object({ reason: z.string().min(2) });

router.post('/dealers/:id/suspend', async (req: Request, res: Response) => {
  const { id } = req.params;
  const parse = suspendSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: 'Invalid payload' });

  const dealer = await prisma.dealer.findUnique({ where: { id } });
  if (!dealer) return res.status(404).json({ error: 'Dealer not found' });
  if (dealer.status === 'DELETED') {
    return res.status(400).json({ error: 'Cannot suspend a deleted dealer' });
  }

  const updated = await prisma.dealer.update({
    where: { id },
    data: { status: 'SUSPENDED', suspensionReason: parse.data.reason },
  });

  await prisma.auditLog.create({
    data: {
      userId: (req as any).admin.adminId,
      userName: 'Admin',
      actionType: 'UPDATE_DEALER',
      details: `Suspended dealer ${updated.companyName}: ${parse.data.reason}`,
      ipAddress: req.ip || 'unknown',
    }
  });

  res.json(updated);
});

// Activate dealer
router.post('/dealers/:id/activate', async (req: Request, res: Response) => {
  const { id } = req.params;

  const dealer = await prisma.dealer.findUnique({ where: { id } });
  if (!dealer) return res.status(404).json({ error: 'Dealer not found' });
  if (dealer.status === 'DELETED') {
    return res.status(400).json({ error: 'Cannot activate a deleted dealer' });
  }

  const updated = await prisma.dealer.update({
    where: { id },
    data: { status: 'ACTIVE', suspensionReason: null },
  });

  await prisma.auditLog.create({
    data: {
      userId: (req as any).admin.adminId,
      userName: 'Admin',
      actionType: 'UPDATE_DEALER',
      details: `Activated dealer ${updated.companyName}`,
      ipAddress: req.ip || 'unknown',
    }
  });

  res.json(updated);
});

// Delete dealer
const deleteSchema = z.object({ reason: z.string().min(2) });

router.post('/dealers/:id/delete', async (req: Request, res: Response) => {
  const { id } = req.params;
  const parse = deleteSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: 'Invalid payload' });

  const dealer = await prisma.dealer.findUnique({ where: { id } });
  if (!dealer) return res.status(404).json({ error: 'Dealer not found' });
  if (dealer.status === 'DELETED') {
    return res.status(400).json({ error: 'Dealer is already deleted' });
  }

  const updated = await prisma.dealer.update({
    where: { id },
    data: {
      status: 'DELETED',
      deletionReason: parse.data.reason,
      deletionDate: new Date(),
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: (req as any).admin.adminId,
      userName: 'Admin',
      actionType: 'UPDATE_DEALER',
      details: `Deleted dealer ${updated.companyName}: ${parse.data.reason}`,
      ipAddress: req.ip || 'unknown',
    }
  });

  res.json(updated);
});

// Reset dealer password
router.post('/dealers/:id/reset-password', async (req: Request, res: Response) => {
  const { id } = req.params;

  const dealer = await prisma.dealer.findUnique({ where: { id } });
  if (!dealer) return res.status(404).json({ error: 'Dealer not found' });

  const tempPassword = `temp_${Math.random().toString(36).slice(-8)}`;
  const passwordHash = await bcrypt.hash(tempPassword, 10);

  await prisma.dealer.update({
    where: { id },
    data: { passwordHash, forcePasswordChange: true },
  });

  await prisma.auditLog.create({
    data: {
      userId: (req as any).admin.adminId,
      userName: 'Admin',
      actionType: 'RESET_PASSWORD',
      details: `Reset password for dealer ${dealer.companyName}`,
      ipAddress: req.ip || 'unknown',
    }
  });

  res.json({ tempPassword });
});

export default router;
