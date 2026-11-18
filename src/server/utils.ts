import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { db } from '../db/index.ts';
import { auditLogs, notifications } from '../db/schema.ts';

export const UPLOADS_ROOT = path.resolve(process.cwd(), 'uploads');

export function ensureUploadDirs() {
  for (const sub of ['3d-models', 'projects', 'pcb', 'b2b', 'support', 'media', 'drone-repairs']) {
    const dir = path.join(UPLOADS_ROOT, sub);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
}

export function createUploadMiddleware(subfolder: string, allowedExts: string[], maxSizeMb = 50) {
  ensureUploadDirs();
  const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, path.join(UPLOADS_ROOT, subfolder));
    },
    filename: (_req, file, cb) => {
      const safeBase = path
        .basename(file.originalname, path.extname(file.originalname))
        .replace(/[^a-zA-Z0-9_-]/g, '_')
        .slice(0, 48);
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `${Date.now()}_${crypto.randomBytes(4).toString('hex')}_${safeBase}${ext}`);
    },
  });

  return multer({
    storage,
    limits: { fileSize: maxSizeMb * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      if (allowedExts.includes(ext)) {
        cb(null, true);
      } else {
        cb(new Error(`Unsupported file extension '${ext}'. Allowed: ${allowedExts.join(', ')}`));
      }
    },
  });
}

export function generateCode(prefix: string): string {
  const datePart = new Date().toISOString().slice(2, 10).replace(/-/g, '');
  const randPart = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `${prefix}-${datePart}-${randPart}`;
}

export async function logAudit(params: {
  actorUid: string;
  actorEmail: string;
  action: string;
  entityType: string;
  entityId?: string | number;
  details?: Record<string, unknown>;
}) {
  try {
    await db.insert(auditLogs).values({
      actorUid: params.actorUid,
      actorEmail: params.actorEmail,
      action: params.action,
      entityType: params.entityType,
      entityId: String(params.entityId ?? ''),
      details: params.details ?? {},
    });
  } catch (err) {
    console.error('Audit log insert failed:', err);
  }
}

export async function createNotification(params: {
  userId: number;
  title: string;
  message: string;
  link?: string;
}) {
  try {
    await db.insert(notifications).values({
      userId: params.userId,
      title: params.title,
      message: params.message,
      link: params.link ?? '/my-account',
    });
  } catch (err) {
    console.error('Notification insert failed:', err);
  }
}

export function isValidIndianPin(pin: string): boolean {
  return /^[1-9][0-9]{5}$/.test(pin.trim());
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  if (!storedHash || !storedHash.includes(':')) return false;
  const [salt, keyHex] = storedHash.split(':');
  if (!salt || !keyHex) return false;
  try {
    const keyBuf = Buffer.from(keyHex, 'hex');
    const derivedBuf = crypto.scryptSync(password, salt, 64);
    if (keyBuf.length !== derivedBuf.length) return false;
    return crypto.timingSafeEqual(keyBuf, derivedBuf);
  } catch {
    return false;
  }
}

export function parseCookies(cookieHeader?: string): Record<string, string> {
  const result: Record<string, string> = {};
  if (!cookieHeader) return result;
  for (const part of cookieHeader.split(';')) {
    const idx = part.indexOf('=');
    if (idx <= 0) continue;
    const key = part.slice(0, idx).trim();
    const val = part.slice(idx + 1).trim();
    try {
      result[key] = decodeURIComponent(val);
    } catch {
      result[key] = val;
    }
  }
  return result;
}
