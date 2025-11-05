import { Router, Request, Response } from 'express';
import { prisma } from '../db';
import { requireAdmin } from '../middleware/adminAuth';

const router = Router();
router.use(requireAdmin);

// Get all audit logs
router.get('/', async (req: Request, res: Response) => {
  const logs = await prisma.auditLog.findMany({
    orderBy: { timestamp: 'desc' },
    take: 500, // Limit to last 500 logs
  });
  res.json(logs);
});

// Get audit logs for specific dealer
router.get('/dealer/:dealerId', async (req: Request, res: Response) => {
  const { dealerId } = req.params;
  const logs = await prisma.auditLog.findMany({
    where: { dealerId },
    orderBy: { timestamp: 'desc' },
    take: 200,
  });
  res.json(logs);
});

export default router;
