import { Request, Response, NextFunction } from 'express';
import { verifySupabaseAccessToken } from '../lib/supabase-admin.ts';
import {
  ADMIN_ROLES_SET,
  getOrCreateUser,
  getUserBySessionToken,
} from '../db/users.ts';
import { parseCookies } from '../server/utils.ts';

export const ADMIN_SESSION_COOKIE = 'ntf_admin_session';
export const USER_SESSION_COOKIE = 'ntf_session';

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

export interface AuthUserClaims {
  uid: string;
  email?: string;
  name?: string;
}

export interface AuthRequest extends Request {
  user?: AuthUserClaims;
  dbUser?: DbUser;
}

async function resolveUserFromRequest(
  req: Request
): Promise<{ dbUser: DbUser; authUser?: AuthUserClaims } | null> {
  // 1. Check signed HTTP-only Admin or User Session cookie
  const cookies = parseCookies(req.headers.cookie);
  const sessionToken = cookies[ADMIN_SESSION_COOKIE] || cookies[USER_SESSION_COOKIE];
  if (sessionToken) {
    const cookieUser = await getUserBySessionToken(sessionToken);
    if (cookieUser && cookieUser.isActive !== false) {
      return {
        dbUser: cookieUser,
        authUser: { uid: cookieUser.uid, email: cookieUser.email, name: cookieUser.fullName },
      };
    }
  }

  // 2. Fall back to Bearer header (signed session token or Supabase Access Token)
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split('Bearer ')[1];

    const sessionUser = await getUserBySessionToken(token);
    if (sessionUser && sessionUser.isActive !== false) {
      return {
        dbUser: sessionUser,
        authUser: { uid: sessionUser.uid, email: sessionUser.email, name: sessionUser.fullName },
      };
    }

    const verified = await verifySupabaseAccessToken(token);
    if (!verified) {
      throw new Error('Invalid or expired authentication token.');
    }
    const dbUser = await getOrCreateUser(verified.uid, verified.email, verified.fullName);
    if (dbUser.isActive === false) {
      throw new Error('Account is disabled.');
    }
    return {
      dbUser,
      authUser: { uid: verified.uid, email: verified.email, name: verified.fullName },
    };
  }

  return null;
}

export const requireAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const resolved = await resolveUserFromRequest(req);
    if (!resolved) {
      return res.status(401).json({ error: 'Authentication required. Please sign in.' });
    }
    req.user = resolved.authUser;
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
      req.user = resolved.authUser;
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
