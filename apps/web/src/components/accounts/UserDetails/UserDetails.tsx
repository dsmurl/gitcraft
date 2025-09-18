import React, { useEffect, useState } from 'react';
import { ApiUser } from '../../../types/user.types';
import { UserEditForm } from '../UserEditForm/UserEditForm';

export const UserDetails = ({
  user,
  onUpdated,
}: {
  user: ApiUser;
  onUpdated?: (user: ApiUser) => void;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [localUser, setLocalUser] = useState<ApiUser>(user);

  // Sync local user when parent user changes
  useEffect(() => {
    setLocalUser(user);
  }, [user]);

  if (isEditing) {
    return (
      <UserEditForm
        user={localUser}
        onCancel={() => setIsEditing(false)}
        onSaved={(u) => {
          setLocalUser(u);
          setIsEditing(false);
          onUpdated?.(u);
        }}
      />
    );
  }

  return (
    <div className="rounded-md border p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm text-gray-600">Database user</div>
        <button
          type="button"
          onClick={() => setIsEditing(true)}
          className="rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700"
        >
          Edit
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="First name" value={localUser.firstName || '—'} />
        <Field label="Last name" value={localUser.lastName || '—'} />
        <Field label="Company" value={localUser.companyName || '—'} />
        <Field
          label="Org (Clerk-managed)"
          value={localUser.clerkOrgName || '—'}
        />
        <Field
          label="Email (Clerk-managed)"
          value={localUser.email || '—'}
          full
        />
      </div>
    </div>
  );
};

function Field({
  label,
  value,
  full,
}: {
  label: string;
  value: React.ReactNode;
  full?: boolean;
}) {
  return (
    <div className={full ? 'sm:col-span-2' : undefined}>
      <div className="text-xs text-gray-500">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  );
}
