import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

const useTurso = Boolean(process.env.TURSO_DATABASE_URL);

// For drizzle-kit, libsql/Turso auth should be passed via the URL (?authToken=...).
const buildLibsqlUrl = (baseUrl: string, token?: string) => {
  if (!token) return baseUrl;
  const u = new URL(baseUrl);
  u.searchParams.set('authToken', token);
  return u.toString();
};

export default defineConfig({
  schema: './src/schema.ts',
  out: './migrations',
  dialect: 'sqlite',
  dbCredentials: useTurso
    ? {
        url: buildLibsqlUrl(
          process.env.TURSO_DATABASE_URL as string,
          process.env.TURSO_AUTH_TOKEN
        ),
      }
    : {
        url: process.env.SQLITE_FILE || './local.sqlite',
      },
});
