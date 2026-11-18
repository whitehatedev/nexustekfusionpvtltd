import { Router } from 'express';
import {
  createAdminSession,
  deleteAdminSession,
  ensureInitialAdminUser,
  getAdminSetupStatus,
  updateUserPassword,
  verifyAdminCredentials,
} from '../../db/users.ts';
import {
  ADMIN_SESSION_COOKIE,
  AuthRequest,
  requireAdmin,
  requireAuth,
} from '../../middleware/auth.ts';
import { logAudit, parseCookies, verifyPassword } from '../utils.ts';
import { db } from '../../db/index.ts';
import { users } from '../../db/schema.ts';
import { eq } from 'drizzle-orm';

export const authRouter = Router();

authRouter.get('/admin-setup-status', async (_req, res) => {
  try {
    await ensureInitialAdminUser();
    const status = await getAdminSetupStatus();
    res.json(status);
  } catch {
    res.status(500).json({ error: 'Failed to inspect admin setup status.' });
  }
});

authRouter.post('/admin-login', async (req, res) => {
  try {
    await ensureInitialAdminUser();
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = await verifyAdminCredentials(email, password);
    if (!user) {
      await logAudit({
        actorUid: 'anonymous',
        actorEmail: email,
        action: 'ADMIN_LOGIN_FAILED',
        entityType: 'admin_auth',
        details: { reason: 'Invalid credentials or unauthorized role' },
      });
      return res.status(401).json({ error: 'Invalid admin email or password.' });
    }

    const ua = String(req.headers['user-agent'] || '');
    const session = await createAdminSession(user.id, ua);

    res.cookie(ADMIN_SESSION_COOKIE, session.cookieValue, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      expires: session.expiresAt,
    });

    await logAudit({
      actorUid: user.uid,
      actorEmail: user.email,
      action: 'ADMIN_LOGIN_SUCCESS',
      entityType: 'admin_auth',
      entityId: user.id,
      details: { role: user.role },
    });

    res.json({
      user: {
        id: user.id,
        uid: user.uid,
        email: user.email,
        fullName: user.fullName,
        mobile: user.mobile,
        companyOrCollege: user.companyOrCollege,
        role: user.role,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ error: 'Unable to sign in right now.' });
  }
});

authRouter.post('/admin-logout', async (req, res) => {
  try {
    const cookies = parseCookies(req.headers.cookie);
    const token = cookies[ADMIN_SESSION_COOKIE];
    if (token) {
      await deleteAdminSession(token);
    }
    res.clearCookie(ADMIN_SESSION_COOKIE, { path: '/' });
    res.json({ ok: true });
  } catch {
    res.clearCookie(ADMIN_SESSION_COOKIE, { path: '/' });
    res.json({ ok: true });
  }
});

authRouter.post('/admin-change-password', requireAuth, requireAdmin(), async (req: AuthRequest, res) => {
  try {
    const currentPassword = String(req.body.currentPassword || '');
    const newPassword = String(req.body.newPassword || '');
    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters long.' });
    }

    const [userRow] = await db.select().from(users).where(eq(users.id, req.dbUser!.id)).limit(1);
    if (!userRow) return res.status(404).json({ error: 'User not found.' });

    if (userRow.passwordHash && !verifyPassword(currentPassword, userRow.passwordHash)) {
      return res.status(400).json({ error: 'Current password is incorrect.' });
    }

    await updateUserPassword(userRow.id, newPassword);
    await logAudit({
      actorUid: userRow.uid,
      actorEmail: userRow.email,
      action: 'ADMIN_PASSWORD_CHANGED',
      entityType: 'user',
      entityId: userRow.id,
    });

    res.json({ ok: true });
  } catch (error) {
    console.error('Password update error:', error);
    res.status(500).json({ error: 'Failed to update password.' });
  }
});
