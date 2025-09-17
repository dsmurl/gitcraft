import React from 'react';

export default function AboutPage() {
  return (
    <section className="mx-auto max-w-3xl p-6">
      <h2 className="text-2xl font-semibold mb-2">About</h2>
      <p className="text-gray-700">
        This app demonstrates porting an existing site into Vite and adding
        Clerk authentication.
      </p>
    </section>
  );
}
