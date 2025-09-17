import React from 'react';
import { SignIn } from '@clerk/clerk-react';

export default function LoginPage() {
  return (
    <section className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="rounded-lg border bg-white p-4 shadow">
        <SignIn
          path="/login"
          routing="path"
          signUpUrl="/login"
          afterSignInUrl="/protected"
        />
      </div>
    </section>
  );
}
