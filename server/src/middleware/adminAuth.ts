import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import type { Request, Response, NextFunction } from 'express';
import { prisma } from '../db';

export interface AdminAuthToken {
  adminId: string;
  username: string;
  role: 'admin';
}

const ADMIN_PASSWORD = 'Admin@2025';

export const requireAdmin = async (req: Request, res: Response, next: NextFunction) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const payload = jwt.verify(token, 'union-secret-2025') as any;
    
    // Check if it's an admin token
    if (payload.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    (req as any).admin = payload;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Admin login helper (can be called from auth routes)
export const verifyAdminPassword = (password: string): boolean => {
  return password === ADMIN_PASSWORD;
};

export const generateAdminToken = (): string => {
  return jwt.sign(
    { adminId: 'admin-1', username: 'admin', role: 'admin' },
    'union-secret-2025',
    { expiresIn: '12h' }
  );
};
