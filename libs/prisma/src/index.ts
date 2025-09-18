// Re-export Prisma types for use across apps (use type-only imports on the web)
export type { User, Prisma } from '@prisma/client';

// Server-side only: get a PrismaClient singleton.
// Do NOT import or call this from the browser code.
let prismaSingleton: import('@prisma/client').PrismaClient | undefined;

export function getPrisma() {
  if (!prismaSingleton) {
    // Use require to keep compatibility with CommonJS in API
    // and avoid accidental static bundling in the browser.
    // This function should only be called on the server.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { PrismaClient } =
      require('@prisma/client') as typeof import('@prisma/client');
    prismaSingleton = new PrismaClient();
  }
  return prismaSingleton;
}
