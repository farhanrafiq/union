import { Router, Request, Response } from 'express';
import { prisma } from '../db';
import { requireAuth } from '../middleware/auth';

const router = Router();
router.use(requireAuth);

// Global search across employees and customers
router.get('/', async (req: Request, res: Response) => {
  const { q } = req.query as { q?: string };
  
  if (!q || q.trim().length < 2) {
    return res.json([]);
  }

  const searchTerm = q.toLowerCase().trim();

  // Search employees
  const employees = await prisma.employee.findMany({
    where: {
      OR: [
        { firstName: { contains: searchTerm, mode: 'insensitive' } },
        { lastName: { contains: searchTerm, mode: 'insensitive' } },
        { phone: { contains: searchTerm } },
        { aadhar: { contains: searchTerm } },
        { email: { contains: searchTerm, mode: 'insensitive' } },
      ],
    },
    include: { dealer: true },
  });

  // Search customers
  const customers = await prisma.customer.findMany({
    where: {
      OR: [
        { nameOrEntity: { contains: searchTerm, mode: 'insensitive' } },
        { phone: { contains: searchTerm } },
        { officialId: { contains: searchTerm } },
        { email: { contains: searchTerm, mode: 'insensitive' } },
      ],
    },
    include: { dealer: true },
  });

  // Format results
  const employeeResults = employees.map((e: any) => ({
    entityType: 'employee',
    entityRefId: e.id,
    canonicalName: `${e.firstName} ${e.lastName}`,
    phoneNorm: e.phone,
    identityNorm: e.aadhar,
    ownerDealerId: e.dealerId,
    ownerDealerName: e.dealer.companyName,
    statusSummary: e.status.toLowerCase(),
    terminationDate: e.terminationDate,
    terminationReason: e.terminationReason,
  }));

  const customerResults = customers.map((c: any) => ({
    entityType: 'customer',
    entityRefId: c.id,
    canonicalName: c.nameOrEntity,
    phoneNorm: c.phone,
    identityNorm: c.officialId,
    ownerDealerId: c.dealerId,
    ownerDealerName: c.dealer.companyName,
    statusSummary: c.status.toLowerCase(),
    customerType: c.type.toLowerCase(),
    terminationDate: c.terminationDate,
    terminationReason: c.terminationReason,
  }));

  // Log search action
  await prisma.auditLog.create({
    data: {
      userId: (req as any).auth.dealerId,
      userName: (req as any).auth.username,
      dealerId: (req as any).auth.dealerId,
      actionType: 'SEARCH',
      details: `Searched for: "${q}"`,
      ipAddress: req.ip || 'unknown',
    }
  });

  res.json([...employeeResults, ...customerResults]);
});

export default router;
