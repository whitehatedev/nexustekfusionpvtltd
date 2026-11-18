import { createClient, SupabaseClient } from '@supabase/supabase-js';

let serverClient: SupabaseClient | null = null;

export function normalizeSupabaseUrl(rawUrl?: string): string {
  const trimmed = (rawUrl || '').trim();
  if (!trimmed) return '';
  try {
    const parsed = new URL(trimmed);
    return parsed.origin;
  } catch {
    return trimmed.replace(/\/(rest|auth|storage|functions)\/v1\/?.*$/i, '').replace(/\/+$/, '');
  }
}

function resolveServerSupabaseEnv() {
  const url = normalizeSupabaseUrl(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL);
  const anonKey = (process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '').trim();
  const serviceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
  return { url, anonKey, serviceRoleKey };
}

export function getSupabasePublicConfig(): { url: string; anonKey: string; configured: boolean } {
  const { url, anonKey } = resolveServerSupabaseEnv();
  return {
    url,
    anonKey,
    configured: Boolean(url && anonKey),
  };
}

export function getServerSupabaseClient(): SupabaseClient | null {
  if (serverClient) return serverClient;
  const { url, anonKey, serviceRoleKey } = resolveServerSupabaseEnv();
  const key = serviceRoleKey || anonKey;
  if (!url || !key) return null;

  serverClient = createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
  return serverClient;
}

export async function verifySupabaseAccessToken(
  token: string
): Promise<{ uid: string; email: string; fullName: string } | null> {
  const client = getServerSupabaseClient();
  if (!client || !token) return null;

  const { data, error } = await client.auth.getUser(token);
  if (error || !data?.user) {
    return null;
  }

  const meta = data.user.user_metadata || {};
  return {
    uid: data.user.id,
    email: data.user.email || '',
    fullName: String(meta.full_name || meta.name || '').trim(),
  };
}
