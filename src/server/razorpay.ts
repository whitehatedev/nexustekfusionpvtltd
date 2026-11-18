import crypto from 'crypto';
import { eq } from 'drizzle-orm';
import { db } from '../db/index.ts';
import { siteSettings } from '../db/schema.ts';

interface StoredPaymentGateway {
  keyIdEnc?: string;
  keySecretEnc?: string;
  webhookSecretEnc?: string;
  updatedBy?: string;
  updatedAt?: string;
}

function getEncryptionKey(): Buffer {
  const secretSource =
    process.env.SESSION_SECRET ||
    process.env.SQL_PASSWORD ||
    'nexustekfusion-nagpur-local-aes256-dev-key';
  return crypto.createHash('sha256').update(secretSource).digest();
}

export function encryptSecret(plainText: string): string {
  const clean = plainText.trim();
  if (!clean) return '';
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', getEncryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(clean, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString('hex')}.${authTag.toString('hex')}.${encrypted.toString('hex')}`;
}

export function decryptSecret(cipherText: string): string {
  if (!cipherText || !cipherText.includes('.')) return '';
  try {
    const [ivHex, tagHex, dataHex] = cipherText.split('.');
    if (!ivHex || !tagHex || !dataHex) return '';
    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      getEncryptionKey(),
      Buffer.from(ivHex, 'hex')
    );
    decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(dataHex, 'hex')),
      decipher.final(),
    ]);
    return decrypted.toString('utf8');
  } catch {
    return '';
  }
}

export async function getRazorpayCredentials(): Promise<{
  keyId: string;
  keySecret: string;
  webhookSecret: string;
  source: 'database' | 'env' | 'none';
}> {
  try {
    const [row] = await db
      .select()
      .from(siteSettings)
      .where(eq(siteSettings.key, 'paymentGatewayConfig'))
      .limit(1);

    if (row?.value) {
      const val = row.value as StoredPaymentGateway;
      const dbKeyId = val.keyIdEnc ? decryptSecret(val.keyIdEnc) : '';
      const dbKeySecret = val.keySecretEnc ? decryptSecret(val.keySecretEnc) : '';
      const dbWebhookSecret = val.webhookSecretEnc ? decryptSecret(val.webhookSecretEnc) : '';

      if (dbKeyId && dbKeySecret) {
        return {
          keyId: dbKeyId,
          keySecret: dbKeySecret,
          webhookSecret: dbWebhookSecret || process.env.RAZORPAY_WEBHOOK_SECRET || '',
          source: 'database',
        };
      }
    }
  } catch {
    // Fall back to environment variables
  }

  const envKeyId = process.env.RAZORPAY_KEY_ID || '';
  const envKeySecret = process.env.RAZORPAY_KEY_SECRET || '';
  const envWebhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || '';

  if (envKeyId && envKeySecret) {
    return {
      keyId: envKeyId,
      keySecret: envKeySecret,
      webhookSecret: envWebhookSecret,
      source: 'env',
    };
  }

  return {
    keyId: '',
    keySecret: '',
    webhookSecret: envWebhookSecret,
    source: 'none',
  };
}

export async function isRazorpayConfigured(): Promise<boolean> {
  const creds = await getRazorpayCredentials();
  return Boolean(creds.keyId && creds.keySecret);
}

export async function createRazorpayOrder(params: {
  amountInr: number;
  receipt: string;
  notes?: Record<string, string>;
}): Promise<{
  mode: 'live_razorpay' | 'test_mode';
  razorpayOrderId: string;
  keyId: string | null;
  amountPaise: number;
}> {
  const amountPaise = Math.max(100, Math.round(params.amountInr * 100));
  const creds = await getRazorpayCredentials();

  if (!creds.keyId || !creds.keySecret) {
    return {
      mode: 'test_mode',
      razorpayOrderId: `order_test_${crypto.randomBytes(6).toString('hex')}`,
      keyId: null,
      amountPaise,
    };
  }

  const authHeader = Buffer.from(`${creds.keyId}:${creds.keySecret}`).toString('base64');

  const response = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${authHeader}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount: amountPaise,
      currency: 'INR',
      receipt: params.receipt,
      notes: params.notes || {},
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Razorpay order creation failed (${response.status}): ${text}`);
  }

  const data = (await response.json()) as { id: string; amount: number };
  return {
    mode: 'live_razorpay',
    razorpayOrderId: data.id,
    keyId: creds.keyId,
    amountPaise: data.amount,
  };
}

export async function verifyRazorpaySignature(params: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}): Promise<boolean> {
  const creds = await getRazorpayCredentials();
  if (!creds.keyId || !creds.keySecret) {
    return (
      params.razorpayOrderId.startsWith('order_test_') &&
      params.razorpayPaymentId.startsWith('pay_test_')
    );
  }
  const expected = crypto
    .createHmac('sha256', creds.keySecret)
    .update(`${params.razorpayOrderId}|${params.razorpayPaymentId}`)
    .digest('hex');

  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(params.razorpaySignature));
  } catch {
    return false;
  }
}

export async function verifyWebhookSignature(
  rawBody: string,
  signatureHeader: string
): Promise<boolean> {
  const creds = await getRazorpayCredentials();
  if (!creds.webhookSecret) return false;
  const expected = crypto
    .createHmac('sha256', creds.webhookSecret)
    .update(rawBody)
    .digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signatureHeader));
  } catch {
    return false;
  }
}
