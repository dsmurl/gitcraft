import type { User } from '@gitcraft/prisma';

// Prisma dates are serialized to strings over HTTP in the web app
export type ApiUser = Omit<User, 'createdAt' | 'updatedAt'> & {
  createdAt: string;
  updatedAt: string;
};
