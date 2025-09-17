import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ClerkProvider } from '@clerk/clerk-react';
import App from './App';
import './index.css';

const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as
  | string
  | undefined;

function MissingClerkConfig() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="max-w-lg w-full rounded-lg border bg-white p-6 shadow">
        <h1 className="text-xl font-semibold mb-2">Clerk is not configured</h1>
        <p className="text-gray-600">
          Please set the environment variable{' '}
          <code className="font-mono">VITE_CLERK_PUBLISHABLE_KEY</code> in your
          .env file. You can obtain this key from your Clerk dashboard
          (Publishable Key).
        </p>
      </div>
    </div>
  );
}

const root = createRoot(document.getElementById('root')!);

root.render(
  <React.StrictMode>
    {clerkPublishableKey ? (
      <ClerkProvider publishableKey={clerkPublishableKey}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ClerkProvider>
    ) : (
      <MissingClerkConfig />
    )}
  </React.StrictMode>
);
