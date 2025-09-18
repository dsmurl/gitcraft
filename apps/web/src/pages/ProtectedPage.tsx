import React, { useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useApi } from '../lib/useApi';

export default function ProtectedPage() {
  const { user } = useUser();
  const { fetchWithAuth } = useApi();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const callPrivate = async () => {
    try {
      setLoading(true);
      setError(null);
      setResult(null);
      const data = await fetchWithAuth('/api/test/private');
      setResult(data);
    } catch (e: any) {
      setError(e?.message ?? 'Request failed');
    } finally {
      setLoading(false);
    }
  };

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

      <div className="mt-6">
        <button
          onClick={callPrivate}
          disabled={loading}
          className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Calling…' : 'Call Private API'}
        </button>

        <div className="mt-4">
          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-red-700">
              Error: {error}
            </div>
          )}
          {result && (
            <pre className="mt-2 whitespace-pre-wrap rounded-md border bg-gray-50 p-3 text-sm">
              {JSON.stringify(result, null, 2)}
            </pre>
          )}
        </div>
      </div>
    </section>
  );
}
