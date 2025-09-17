import React from 'react';

export default function PublicPage() {
  return (
    <section className="mx-auto max-w-3xl p-6">
      <h2 className="text-2xl font-semibold mb-2">Public Page</h2>
      <p className="text-gray-700">
        Anyone can view this page. It does not require authentication.
      </p>
    </section>
  );
}
