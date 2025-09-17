import React from 'react';
import { useUser } from '@clerk/clerk-react';

export default function ProtectedPage() {
  const { user } = useUser();

  return (
    <section className="mx-auto max-w-3xl p-6">
      <h2 className="text-2xl font-semibold mb-2">Protected Page</h2>
      <p className="text-gray-700">
        This page is only visible to signed-in users.
      </p>
      <div className="mt-4 rounded-md border p-4">
        <div className="text-sm text-gray-600">Signed in as</div>
        <div className="font-medium">
          {user?.fullName ||
            user?.primaryEmailAddress?.emailAddress ||
            user?.username}
        </div>
      </div>
    </section>
  );
}
