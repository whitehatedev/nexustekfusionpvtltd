import { Request, Response, NextFunction } from 'express';
import { DecodedIdToken } from 'firebase-admin/auth';
import { adminAuth } from '../lib/firebase-admin.ts';
import {
  ADMIN_ROLES_SET,
  getOrCreateUser,
  getUserBySessionToken,
} from '../db/users.ts';
import { parseCookies } from '../server/utils.ts';

export const ADMIN_SESSION_COOKIE = 'ntf_admin_session';

export const ADMIN_ROLES = ADMIN_ROLES_SET;

export interface DbUser {
  id: number;
  uid: string;
  email: string;
  fullName: string;
  mobile: string;
  companyOrCollege: string;
  role: string;
  isActive?: boolean;
}

export interface AuthRequest extends Request {
  user?: DecodedIdToken;
  dbUser?: DbUser;
}

async function resolveUserFromRequest(req: Request): Promise<{ dbUser: DbUser; firebaseUser?: DecodedIdToken } | null> {
  // 1. Check signed HTTP-only Admin Session cookie first
  const cookies = parseCookies(req.headers.cookie);
  const sessionToken = cookies[ADMIN_SESSION_COOKIE];
  if (sessionToken) {
    const cookieUser = await getUserBySessionToken(sessionToken);
    if (cookieUser && cookieUser.isActive !== false) {
      return { dbUser: cookieUser };
    }
  }

  // 2. Fall back to Firebase ID Token Bearer header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    const dbUser = await getOrCreateUser(
      decodedToken.uid,
      decodedToken.email || '',
      decodedToken.name || ''
    );
    if (dbUser.isActive === false) {
      throw new Error('Account is disabled.');
    }
    return { dbUser, firebaseUser: decodedToken };
  }

  return null;
}

export const requireAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const resolved = await resolveUserFromRequest(req);
    if (!resolved) {
      return res.status(401).json({ error: 'Authentication required. Please sign in.' });
    }
    req.user = resolved.firebaseUser;
    req.dbUser = resolved.dbUser;
    next();
  } catch (error: any) {
    console.error('Auth verification error:', error);
    return res.status(401).json({ error: error?.message || 'Invalid or expired authentication token.' });
  }
};

export const optionalAuth = async (req: AuthRequest, _res: Response, next: NextFunction) => {
  try {
    const resolved = await resolveUserFromRequest(req);
    if (resolved) {
      req.user = resolved.firebaseUser;
      req.dbUser = resolved.dbUser;
    }
  } catch {
    // Ignore optional auth failures on public routes
  }
  next();
};

export const requireAdmin = (allowedRoles?: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.dbUser) {
      return res.status(401).json({ error: 'Authentication required.' });
    }
    if (req.dbUser.isActive === false) {
      return res.status(403).json({ error: 'This staff account has been deactivated.' });
    }
    const role = req.dbUser.role;
    if (!ADMIN_ROLES.has(role)) {
      return res.status(403).json({ error: 'Admin access denied for your account role.' });
    }
    if (allowedRoles && role !== 'super_admin' && role !== 'admin' && !allowedRoles.includes(role)) {
      return res.status(403).json({ error: `Role '${role}' is not authorized for this action.` });
    }
    next();
  };
};
