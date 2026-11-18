import crypto from 'crypto';
import { and, eq, gt, sql } from 'drizzle-orm';
import { db } from './index.ts';
import { adminSessions, users } from './schema.ts';
import { hashPassword, verifyPassword } from '../server/utils.ts';

const DEFAULT_ADMIN_EMAILS = ['info.nexustekfusion@gmail.com', 'info@nexustekfusion.in'];

export const ADMIN_ROLES_SET = new Set([
  'super_admin',
  'admin',
  'website_manager',
  'product_manager',
  'sales_manager',
  'project_manager',
  'engineer',
  'printing_operator',
  'inventory_manager',
  'accounts_manager',
  'support_manager',
  'support_staff',
]);

const FALLBACK_SESSION_SECRET = crypto
  .createHash('sha256')
  .update(`ntf-session-${process.pid}-${process.env.DATABASE_URL || 'local'}`)
  .digest('hex');

function getSessionSecret(): string {
  return (
    process.env.ADMIN_SESSION_SECRET ||
    process.env.SESSION_SECRET ||
    FALLBACK_SESSION_SECRET
  );
}

function signSessionToken(rawToken: string): string {
  const sig = crypto
    .createHmac('sha256', getSessionSecret())
    .update(rawToken)
    .digest('hex');
  return `${rawToken}.${sig}`;
}

function verifySignedSessionToken(signed: string): string | null {
  const parts = signed.split('.');
  if (parts.length !== 2) return null;
  const [rawToken, providedSig] = parts;
  if (!rawToken || !providedSig) return null;
  const expectedSig = crypto
    .createHmac('sha256', getSessionSecret())
    .update(rawToken)
    .digest('hex');
  try {
    const a = Buffer.from(providedSig, 'hex');
    const b = Buffer.from(expectedSig, 'hex');
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
    return rawToken;
  } catch {
    return null;
  }
}

function isBootstrapAdminEmail(email: string): boolean {
  const configured = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  const envInitial = (process.env.INITIAL_ADMIN_EMAIL || '').trim().toLowerCase();
  if (envInitial) configured.push(envInitial);
  const allAdmins = new Set([...DEFAULT_ADMIN_EMAILS, ...configured]);
  return allAdmins.has(email.trim().toLowerCase());
}

export async function ensureInitialAdminUser(): Promise<void> {
  const email = (process.env.INITIAL_ADMIN_EMAIL || '').trim().toLowerCase();
  const password = process.env.INITIAL_ADMIN_PASSWORD || '';
  const name = (process.env.INITIAL_ADMIN_NAME || 'Super Admin').trim();

  if (!email || !password) return;

  try {
    const existing = await db
      .select()
      .from(users)
      .where(sql`lower(${users.email}) = ${email}`)
      .limit(1);

    if (existing.length > 0) {
      const current = existing[0];
      if (!current.passwordHash) {
        await db
          .update(users)
          .set({
            fullName: current.fullName || name,
            role: 'super_admin',
            passwordHash: hashPassword(password),
            isActive: true,
            updatedAt: new Date(),
          })
          .where(eq(users.id, current.id));
      } else if (current.role === 'customer') {
        await db
          .update(users)
          .set({ role: 'super_admin', updatedAt: new Date() })
          .where(eq(users.id, current.id));
      }
      return;
    }

    await db.insert(users).values({
      uid: `admin_${crypto.randomBytes(6).toString('hex')}`,
      email,
      fullName: name,
      role: 'super_admin',
      passwordHash: hashPassword(password),
      isActive: true,
    });
  } catch (error) {
    console.error('Failed to ensure initial admin user:', error);
  }
}

export async function getAdminSetupStatus() {
  const passwordAdmins = await db
    .select({ id: users.id })
    .from(users)
    .where(sql`${users.passwordHash} <> '' AND ${users.isActive} = true`);
  const hasPasswordAdmin = passwordAdmins.length > 0;
  const envConfigured = Boolean(process.env.INITIAL_ADMIN_EMAIL && process.env.INITIAL_ADMIN_PASSWORD);
  return {
    configured: hasPasswordAdmin || envConfigured,
    hasPasswordAdmin,
    envConfigured,
  };
}

export async function verifyAdminCredentials(email: string, password: string) {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail || !password) return null;

  const rows = await db
    .select()
    .from(users)
    .where(sql`lower(${users.email}) = ${cleanEmail}`)
    .limit(1);

  const user = rows[0];
  if (!user || !user.isActive || !ADMIN_ROLES_SET.has(user.role)) {
    return null;
  }
  if (!user.passwordHash || !verifyPassword(password, user.passwordHash)) {
    return null;
  }
  return user;
}

export async function verifyUserCredentials(email: string, password: string) {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail || !password) return null;

  const rows = await db
    .select()
    .from(users)
    .where(sql`lower(${users.email}) = ${cleanEmail}`)
    .limit(1);

  const user = rows[0];
  if (!user || !user.isActive) {
    return null;
  }
  if (!user.passwordHash || !verifyPassword(password, user.passwordHash)) {
    return null;
  }
  return user;
}

export async function registerUserWithPassword(input: {
  email: string;
  password: string;
  fullName: string;
  mobile?: string;
  companyOrCollege?: string;
}) {
  const cleanEmail = input.email.trim().toLowerCase();
  const existing = await db
    .select()
    .from(users)
    .where(sql`lower(${users.email}) = ${cleanEmail}`)
    .limit(1);

  if (existing.length > 0) {
    throw new Error('An account with this email already exists. Please sign in instead.');
  }

  const role = isBootstrapAdminEmail(cleanEmail) ? 'super_admin' : 'customer';
  const [inserted] = await db
    .insert(users)
    .values({
      uid: `usr_${crypto.randomBytes(8).toString('hex')}`,
      email: cleanEmail,
      fullName: input.fullName.trim(),
      mobile: (input.mobile || '').trim(),
      companyOrCollege: (input.companyOrCollege || '').trim(),
      role,
      passwordHash: hashPassword(input.password),
      isActive: true,
    })
    .returning();

  return inserted;
}

export async function createAdminSession(userId: number, userAgent = '') {
  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await db.insert(adminSessions).values({
    tokenHash,
    userId,
    userAgent: userAgent.slice(0, 240),
    expiresAt,
  });

  return {
    cookieValue: signSessionToken(rawToken),
    expiresAt,
  };
}

export async function getUserBySessionToken(signedToken: string) {
  const rawToken = verifySignedSessionToken(signedToken);
  if (!rawToken) return null;
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

  const rows = await db
    .select({ user: users })
    .from(adminSessions)
    .innerJoin(users, eq(adminSessions.userId, users.id))
    .where(and(eq(adminSessions.tokenHash, tokenHash), gt(adminSessions.expiresAt, new Date())))
    .limit(1);

  const found = rows[0]?.user;
  if (!found || !found.isActive) return null;
  return found;
}

export async function deleteAdminSession(signedToken: string) {
  const rawToken = verifySignedSessionToken(signedToken);
  if (!rawToken) return;
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  await db.delete(adminSessions).where(eq(adminSessions.tokenHash, tokenHash));
}

export async function updateUserPassword(userId: number, newPassword: string) {
  await db
    .update(users)
    .set({
      passwordHash: hashPassword(newPassword),
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));
}

export async function getOrCreateUser(uid: string, email: string, fullName?: string) {
  try {
    const existing = await db.select().from(users).where(eq(users.uid, uid)).limit(1);
    const shouldBeSuperAdmin = isBootstrapAdminEmail(email);

    if (existing.length > 0) {
      const current = existing[0];
      const nextRole = shouldBeSuperAdmin && current.role === 'customer' ? 'super_admin' : current.role;
      const [updated] = await db
        .update(users)
        .set({
          email,
          fullName: current.fullName || fullName || '',
          role: nextRole,
          updatedAt: new Date(),
        })
        .where(eq(users.uid, uid))
        .returning();
      return updated;
    }

    // Link existing account by email when migrating from password/pre-provisioned account to Supabase UID
    if (email) {
      const byEmail = await db
        .select()
        .from(users)
        .where(sql`lower(${users.email}) = ${email.trim().toLowerCase()}`)
        .limit(1);
      if (byEmail.length > 0) {
        const nextRole = shouldBeSuperAdmin && byEmail[0].role === 'customer' ? 'super_admin' : byEmail[0].role;
        const [linked] = await db
          .update(users)
          .set({
            uid,
            fullName: byEmail[0].fullName || fullName || '',
            role: nextRole,
            updatedAt: new Date(),
          })
          .where(eq(users.id, byEmail[0].id))
          .returning();
        return linked;
      }
    }

    const [inserted] = await db
      .insert(users)
      .values({
        uid,
        email,
        fullName: fullName || '',
        role: shouldBeSuperAdmin ? 'super_admin' : 'customer',
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          email,
          updatedAt: new Date(),
        },
      })
      .returning();

    return inserted;
  } catch (error) {
    console.error('Failed to upsert user:', error);
    throw new Error('Failed to synchronize user account.', { cause: error });
  }
}

export async function getUserByUid(uid: string) {
  try {
    const rows = await db.select().from(users).where(eq(users.uid, uid)).limit(1);
    return rows[0] || null;
  } catch (error) {
    console.error('Failed to fetch user:', error);
    throw new Error('Failed to retrieve user record.', { cause: error });
  }
}
