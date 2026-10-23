import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { db, User } from './db';

const JWT_SECRET = process.env.JWT_SECRET || 'slugify_jwt_super_secret_key_2026_x7a9';

export interface AuthRequest extends Request {
  user?: User;
  clientIp?: string;
}

export function hashPassword(plain: string): string {
  return bcrypt.hashSync(plain, 10);
}

export function verifyPassword(plain: string, hash: string): boolean {
  return bcrypt.compareSync(plain, hash);
}

export function generateToken(user: User): string {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
}

export function extractClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.socket.remoteAddress || req.ip || '127.0.0.1';
}

/**
 * Middleware that attempts to decode JWT token if present.
 * Does not block anonymous visitors.
 */
export function optionalAuth(req: AuthRequest, _res: Response, next: NextFunction) {
  req.clientIp = extractClientIp(req);
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
      const user = db.findUserById(decoded.userId);
      if (user) {
        req.user = user;
      }
    } catch {
      // invalid or expired token, proceed as anonymous
    }
  }
  next();
}

/**
 * Middleware that blocks requests if not authenticated as a registered user.
 */
export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  optionalAuth(req, res, () => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required. Please sign in or create an account to access this resource.',
        code: 'UNAUTHORIZED',
      });
    }
    next();
  });
}

/**
 * Middleware that blocks requests if user is not an administrator.
 * Server-enforced role verification.
 */
export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  requireAuth(req, res, () => {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({
        error: 'Access denied. Administrator privileges required.',
        code: 'FORBIDDEN',
      });
    }
    next();
  });
}

/**
 * API Key authentication middleware for public programmatic API (/api/v1/*).
 */
export function authenticateApiKey(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Missing or invalid Authorization header. Provide your API key as: Bearer sk_live_...',
      code: 'API_KEY_REQUIRED',
    });
  }

  const key = authHeader.substring(7).trim();
  if (!key.startsWith('sk_live_')) {
    return res.status(401).json({
      error: 'Invalid API key format. API keys must start with sk_live_',
      code: 'INVALID_API_KEY_FORMAT',
    });
  }

  const keyHash = crypto.createHash('sha256').update(key).digest('hex');
  const record = db.findApiKeyByHash(keyHash);

  if (!record || record.status !== 'active') {
    return res.status(401).json({
      error: 'Invalid, revoked, or expired API key.',
      code: 'INVALID_API_KEY',
    });
  }

  const user = db.findUserById(record.userId);
  if (!user) {
    return res.status(401).json({ error: 'User account associated with this API key not found.' });
  }

  db.touchApiKeyUsage(record.id);
  req.user = user;
  next();
}
