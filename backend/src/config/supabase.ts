import { createClient } from '@supabase/supabase-js';
import { config as loadEnv } from 'dotenv';
import { existsSync } from 'fs';
import { join } from 'path';

const envPathCandidates = [
  join(process.cwd(), '.env'),
  join(process.cwd(), 'backend', '.env'),
  join(process.cwd(), '..', 'backend', '.env'),
];

const envPath = envPathCandidates.find((candidate) => existsSync(candidate));

if (envPath) {
  loadEnv({ path: envPath });
} else {
  loadEnv();
}

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing Supabase configuration: ${name} is required.`);
  }
  return value;
}

function getJwtRole(token: string): string | null {
  const parts = token.split('.');
  if (parts.length !== 3) {
    return null;
  }

  try {
    const payloadJson = Buffer.from(parts[1], 'base64url').toString('utf8');
    const payload = JSON.parse(payloadJson) as { role?: string };
    return payload.role ?? null;
  } catch {
    return null;
  }
}

function assertServiceRoleKey(key: string): void {
  const normalized = key.trim();

  if (normalized.startsWith('sb_publishable_') || normalized.startsWith('sb_anon_')) {
    throw new Error(
      'Invalid SUPABASE_SERVICE_ROLE_KEY: received a public/publishable key. Use the service-role server key from Supabase project settings.',
    );
  }

  if (normalized.startsWith('sb_secret_')) {
    return;
  }

  const jwtRole = getJwtRole(normalized);
  if (jwtRole && jwtRole !== 'service_role') {
    throw new Error(
      `Invalid SUPABASE_SERVICE_ROLE_KEY: expected role "service_role" but received "${jwtRole}".`,
    );
  }

  if (!jwtRole) {
    throw new Error(
      'Invalid SUPABASE_SERVICE_ROLE_KEY format. Expected a service_role JWT or an sb_secret_ key.',
    );
  }
}

const supabaseUrl = requireEnv('SUPABASE_URL');
const supabaseServiceRoleKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY');
assertServiceRoleKey(supabaseServiceRoleKey);

export const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

export const supabaseBucket = requireEnv('SUPABASE_BUCKET');
