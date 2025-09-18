import React, { useEffect, useState } from 'react';
import { useUser } from '@clerk/clerk-react';

import { useApi } from '../lib/useApi';
import { UserDetails } from '../components/accounts/UserDetails/UserDetails';
import type { ApiUser } from '../types/user.types';

export default function AccountPage() {
  const { user } = useUser();
  const { fetchWithAuth } = useApi();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dbUser, setDbUser] = useState<ApiUser | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        setError(null);
        // Ensure a DB user exists and fetch it
        const resp = await fetchWithAuth('/api/user/ensure', {
          method: 'POST',
          body: JSON.stringify({}),
        });
        if (!cancelled) {
          setDbUser(resp.user as ApiUser);
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? 'Failed to load account');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [fetchWithAuth]);

  return (
    <section className="mx-auto max-w-3xl p-6">
      <h2 className="text-2xl font-semibold mb-2">My Account</h2>
      <p className="text-gray-700">
        View your account details from Clerk and the app database.
      </p>

      <div className="mt-4 grid grid-cols-1 gap-4">
        <div className="rounded-md border p-4">
          <div className="text-sm text-gray-600 mb-1">Signed in as (Clerk)</div>
          <div className="font-medium">
            {user?.fullName ||
              user?.primaryEmailAddress?.emailAddress ||
              user?.username}
          </div>
        </div>

        {loading && (
          <div className="rounded-md border p-4">
            <div className="text-sm text-gray-600 mb-3">Database user</div>
            <div className="animate-pulse text-gray-600">Loading…</div>
          </div>
        )}
        {error && (
          <div className="rounded-md border p-4">
            <div className="text-sm text-gray-600 mb-3">Database user</div>
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-red-700">
              {error}
            </div>
          </div>
        )}
        {dbUser && !loading && !error && <UserDetails user={dbUser} />}
      </div>
    </section>
  );
}
