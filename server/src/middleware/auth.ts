import jwt from 'jsonwebtoken';
import type { Request, Response, NextFunction } from 'express';

export interface AuthToken {
  dealerId: string;
  username: string;
}

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'changeme') as AuthToken;
    (req as any).auth = payload;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
};
