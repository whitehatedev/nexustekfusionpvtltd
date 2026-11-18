import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.ts';
import { createMockDb } from './mock.ts';

declare global {
  var _postgresPool: Pool | undefined;
}

const hasDatabaseConfig = Boolean(
  process.env.DATABASE_URL ||
    (process.env.SQL_HOST && process.env.SQL_DB_NAME && process.env.SQL_USER)
);

const useSslForConnectionString = Boolean(
  process.env.DATABASE_URL &&
    (process.env.DATABASE_SSL === 'true' ||
      process.env.DATABASE_URL.includes('supabase.co') ||
      process.env.DATABASE_URL.includes('supabase.com') ||
      process.env.DATABASE_URL.includes('sslmode=require'))
);

export const createPool = () => {
  if (!hasDatabaseConfig) return undefined;
  if (!global._postgresPool) {
    global._postgresPool = new Pool(
      process.env.DATABASE_URL
        ? {
            connectionString: process.env.DATABASE_URL,
            ssl: useSslForConnectionString ? { rejectUnauthorized: false } : undefined,
            max: 10,
            connectionTimeoutMillis: 15000,
          }
        : {
            host: process.env.SQL_HOST,
            user: process.env.SQL_USER,
            password: process.env.SQL_PASSWORD,
            database: process.env.SQL_DB_NAME,
            max: 10,
            connectionTimeoutMillis: 15000,
          }
    );

    global._postgresPool.on('error', (err) => {
      console.error('Unexpected error on idle SQL pool client:', err);
    });
  }
  return global._postgresPool;
};

let db: NodePgDatabase<typeof schema>;

if (hasDatabaseConfig) {
  try {
    const pool = createPool()!;
    db = drizzle(pool, { schema });
  } catch {
    console.warn('[AI Studio] Database connection failed — using in-memory mock database');
    db = createMockDb();
  }
} else {
  console.warn('[AI Studio] Database not configured — using in-memory mock database');
  db = createMockDb();
}

export { db };
