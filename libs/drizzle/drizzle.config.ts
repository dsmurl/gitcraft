import { defineConfig } from 'drizzle-kit';

const useTurso = Boolean(process.env.TURSO_DATABASE_URL);

export default defineConfig({
  schema: './src/schema.ts',
  out: './migrations',
  dialect: 'sqlite',
  driver: useTurso ? 'turso' : 'better-sqlite',
  dbCredentials: useTurso
    ? {
        url: process.env.TURSO_DATABASE_URL as string,
        authToken: process.env.TURSO_AUTH_TOKEN as string | undefined,
      }
    : {
        url: process.env.SQLITE_FILE || './local.sqlite',
      }
});
