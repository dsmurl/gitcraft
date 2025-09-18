import React, { useState } from 'react';

import { useApi } from '../../../lib/useApi';
import { ApiUser } from '../../../types/user.types';

export const UserEditForm = ({
  user,
  onCancel,
  onSaved,
}: {
  user: ApiUser;
  onCancel: () => void;
  onSaved: (user: ApiUser) => void;
}) => {
  const { fetchWithAuth } = useApi();
  const [firstName, setFirstName] = useState(user.firstName ?? '');
  const [lastName, setLastName] = useState(user.lastName ?? '');
  const [companyName, setCompanyName] = useState(user.companyName ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasChanges =
    (firstName ?? '') !== (user.firstName ?? '') ||
    (lastName ?? '') !== (user.lastName ?? '') ||
    (companyName ?? '') !== (user.companyName ?? '');

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      const payload: Record<string, string> = {};
      if ((firstName ?? '') !== (user.firstName ?? ''))
        payload.firstName = firstName;
      if ((lastName ?? '') !== (user.lastName ?? ''))
        payload.lastName = lastName;
      if ((companyName ?? '') !== (user.companyName ?? ''))
        payload.companyName = companyName;

      const resp = await fetchWithAuth('/api/user/me', {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });

      onSaved(resp.user as ApiUser);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to save changes');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-md border p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm text-gray-600">Edit account details</div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            form="user-edit-form"
            className="rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
            disabled={loading || !hasChanges}
          >
            {loading ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>

      <form id="user-edit-form" onSubmit={onSubmit}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="First name">
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full rounded-md border px-3 py-2"
              placeholder="First name"
            />
          </Field>
          <Field label="Last name">
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full rounded-md border px-3 py-2"
              placeholder="Last name"
            />
          </Field>
          <Field label="Company">
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full rounded-md border px-3 py-2"
              placeholder="Company"
            />
          </Field>
          <Field label="Org (Clerk-managed)">
            <div className="font-medium">{user.clerkOrgName || '—'}</div>
          </Field>
          <Field label="Email (Clerk-managed)" full>
            <div className="font-medium">{user.email || '—'}</div>
          </Field>
        </div>

        {error && (
          <div className="mt-3 rounded-md border border-red-200 bg-red-50 p-3 text-red-700">
            {error}
          </div>
        )}
      </form>
    </div>
  );
};

function Field({
  label,
  children,
  full,
}: {
  label: string;
  children: React.ReactNode;
  full?: boolean;
}) {
  return (
    <div className={full ? 'sm:col-span-2' : undefined}>
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      {children}
    </div>
  );
}
