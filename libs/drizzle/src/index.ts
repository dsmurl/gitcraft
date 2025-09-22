import type { LibSQLDatabase } from 'drizzle-orm/libsql';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';

// Export schema and types for consumers (use type-only imports on the web)
export { users } from './schema';
export type { User, NewUser } from './schema';

type AnyDb = LibSQLDatabase<typeof schema> | BetterSQLite3Database<typeof schema>;
let dbSingleton: AnyDb | undefined;

/**
 * getDb: Server-only Drizzle database singleton.
 * - Turso/libsql mode: requires TURSO_DATABASE_URL and TURSO_AUTH_TOKEN.
 * - Local SQLite mode: set SQLITE_FILE to a path (e.g., "./local.sqlite").
 */
export function getDb(): AnyDb {
  if (dbSingleton) return dbSingleton;

  const tursoUrl = process.env.TURSO_DATABASE_URL;
  const tursoToken = process.env.TURSO_AUTH_TOKEN;
  const sqliteFile = process.env.SQLITE_FILE;

  if (tursoUrl) {
    if (!tursoToken) {
      throw new Error('TURSO_DATABASE_URL is set but TURSO_AUTH_TOKEN is missing.');
    }
    // Lazy-require to avoid bundling server-only deps into the web
    const { createClient } = require('@libsql/client') as typeof import('@libsql/client');
    const { drizzle } = require('drizzle-orm/libsql') as typeof import('drizzle-orm/libsql');
    const client = createClient({ url: tursoUrl, authToken: tursoToken });
    dbSingleton = drizzle(client, { schema }) as AnyDb;
    return dbSingleton;
  }

  if (sqliteFile) {
    const BetterSqlite3 = require('better-sqlite3') as typeof import('better-sqlite3');
    const { drizzle } =
      require('drizzle-orm/better-sqlite3') as typeof import('drizzle-orm/better-sqlite3');
    const sqlite = new BetterSqlite3(sqliteFile);
    dbSingleton = drizzle(sqlite, { schema }) as AnyDb;
    return dbSingleton;
  }

  throw new Error(
    'No database configuration found. Set TURSO_DATABASE_URL (+ TURSO_AUTH_TOKEN) or SQLITE_FILE.'
  );
}
