import { Router } from 'express';
import { requireAuth, getAuth, clerkClient } from '@clerk/express';
import { getPrisma } from '@gitcraft/prisma';

export const router = Router();

async function getClerkOrgName(orgId?: string) {
  if (!orgId) return undefined;
  try {
    const org = await clerkClient.organizations.getOrganization({
      organizationId: orgId,
    });
    return org?.name as string | undefined;
  } catch {
    return undefined;
  }
}

// GET /api/user/me -> return the current user's DB record by clerkUserId
router.get('/me', requireAuth(), async (req, res) => {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return res.status(401).json({ ok: false, error: 'UNAUTHENTICATED' });
    }
    const prisma = getPrisma();
    const user = await prisma.user.findUnique({
      where: { clerkUserId: userId },
    });
    if (!user) {
      return res.status(404).json({ ok: false, error: 'USER_NOT_FOUND' });
    }
    return res.json({ ok: true, user });
  } catch (err: any) {
    return res
      .status(500)
      .json({ ok: false, error: 'INTERNAL_ERROR', detail: err?.message });
  }
});

// POST /api/user/ensure -> upsert the current user's record
// Body (optional): { firstName?: string, lastName?: string, companyName?: string }
router.post('/ensure', requireAuth(), async (req, res) => {
  try {
    const { userId, orgId } = getAuth(req);
    if (!userId) {
      return res.status(401).json({ ok: false, error: 'UNAUTHENTICATED' });
    }

    // Always source email from Clerk (no client-provided email)
    const clerkUser = await clerkClient.users.getUser(userId);
    const email =
      clerkUser?.primaryEmailAddress?.emailAddress ??
      clerkUser?.emailAddresses?.[0]?.emailAddress;
    if (!email) {
      return res.status(400).json({
        ok: false,
        error: 'EMAIL_REQUIRED',
        message: 'No email found on Clerk user.',
      });
    }

    // Optional body inputs; fallbacks pulled from Clerk
    const bodyFirst = (req.body?.firstName as string | undefined)?.trim();
    const bodyLast = (req.body?.lastName as string | undefined)?.trim();
    const bodyCompany = (req.body?.companyName as string | undefined)?.trim();

    const fallbackFirst = bodyFirst ?? clerkUser?.firstName ?? undefined;
    const fallbackLast = bodyLast ?? clerkUser?.lastName ?? undefined;
    const fallbackCompany = bodyCompany ?? undefined;

    const clerkOrgName = await getClerkOrgName(orgId);

    const prisma = getPrisma();
    const existing = await prisma.user.findUnique({
      where: { clerkUserId: userId },
    });

    // If no record exists, create it with Clerk-derived values (and optional body overrides)
    if (!existing) {
      const user = await prisma.user.create({
        data: {
          clerkUserId: userId,
          email,
          ...(fallbackFirst !== undefined ? { firstName: fallbackFirst } : {}),
          ...(fallbackLast !== undefined ? { lastName: fallbackLast } : {}),
          ...(fallbackCompany !== undefined
            ? { companyName: fallbackCompany }
            : {}),
          ...(clerkOrgName !== undefined ? { clerkOrgName } : {}),
        },
      });
      return res.status(200).json({ ok: true, user });
    }

    // If record exists, only backfill fields that are empty/null; preserve user edits.
    const isEmpty = (v?: string | null) => !v || v.trim() === '';
    const updateData: Record<string, unknown> = {};

    if (isEmpty(existing.firstName) && fallbackFirst !== undefined) {
      updateData.firstName = fallbackFirst;
    }
    if (isEmpty(existing.lastName) && fallbackLast !== undefined) {
      updateData.lastName = fallbackLast;
    }
    if (isEmpty(existing.companyName) && fallbackCompany !== undefined) {
      updateData.companyName = fallbackCompany;
    }
    // Always refresh org name from Clerk when available (server-derived, not user-editable)
    if (clerkOrgName !== undefined) {
      updateData.clerkOrgName = clerkOrgName;
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(200).json({ ok: true, user: existing });
    }

    const user = await prisma.user.update({
      where: { clerkUserId: userId },
      data: updateData,
    });
    return res.status(200).json({ ok: true, user });
  } catch (err: any) {
    if (
      typeof err?.message === 'string' &&
      err.message.includes('Unique constraint')
    ) {
      return res.status(409).json({
        ok: false,
        error: 'CONFLICT',
        message: 'Unique constraint failed.',
      });
    }
    return res
      .status(500)
      .json({ ok: false, error: 'INTERNAL_ERROR', detail: err?.message });
  }
});

// PATCH /api/user/me -> update firstName, lastName, companyName (email cannot be changed)
// Body: { firstName?: string, lastName?: string, companyName?: string }
router.patch('/me', requireAuth(), async (req, res) => {
  try {
    const { userId, orgId } = getAuth(req);
    if (!userId) {
      return res.status(401).json({ ok: false, error: 'UNAUTHENTICATED' });
    }

    const firstName = (req.body?.firstName as string | undefined)?.trim();
    const lastName = (req.body?.lastName as string | undefined)?.trim();
    const companyName = (req.body?.companyName as string | undefined)?.trim();
    const clerkOrgName = await getClerkOrgName(orgId);

    const updateData: Record<string, unknown> = {};
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (companyName !== undefined) updateData.companyName = companyName;
    if (clerkOrgName !== undefined) updateData.clerkOrgName = clerkOrgName;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        ok: false,
        error: 'NO_CHANGES',
        message: 'Provide at least one of firstName, lastName, or companyName.',
      });
    }

    const prisma = getPrisma();
    const user = await prisma.user.update({
      where: { clerkUserId: userId },
      data: updateData,
    });
    return res.json({ ok: true, user });
  } catch (err: any) {
    if (
      typeof err?.message === 'string' &&
      err.message.includes('Record to update not found')
    ) {
      return res.status(404).json({ ok: false, error: 'USER_NOT_FOUND' });
    }
    if (
      typeof err?.message === 'string' &&
      err.message.includes('Unique constraint')
    ) {
      return res.status(409).json({
        ok: false,
        error: 'CONFLICT',
        message: 'Unique constraint failed.',
      });
    }
    return res
      .status(500)
      .json({ ok: false, error: 'INTERNAL_ERROR', detail: err?.message });
  }
});
