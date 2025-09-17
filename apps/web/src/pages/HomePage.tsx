import React from 'react';
import { Link } from 'react-router-dom';
import { SignedIn, SignedOut } from '@clerk/clerk-react';

export default function HomePage() {
  return (
    <section className="mx-auto max-w-4xl p-6">
      <h1 className="text-3xl font-bold mb-3">Welcome</h1>
      <p className="text-gray-700 mb-6 pt-3">
        This is a Vite + React app port with Clerk authentication and React
        Router.
      </p>

      <div className="mt-6 text-sm text-gray-600">
        <SignedOut>Sign in to access the protected page.</SignedOut>
        <SignedIn>You are signed in. Try the protected page.</SignedIn>
      </div>
    </section>
  );
}
