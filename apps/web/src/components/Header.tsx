import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import {
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
} from '@clerk/clerk-react';

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `px-3 py-2 rounded-md text-sm font-medium ${isActive ? 'bg-gray-900 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`;

export default function Header() {
  return (
    <header className="bg-gray-800">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/" className="text-white font-semibold">
              My Site
            </Link>
            <nav className="flex items-center gap-2">
              <NavLink to="/" className={navLinkClass} end>
                Home
              </NavLink>
              <NavLink to="/public" className={navLinkClass}>
                Public
              </NavLink>
              <NavLink to="/about" className={navLinkClass}>
                About
              </NavLink>
              <NavLink to="/protected" className={navLinkClass}>
                Protected
              </NavLink>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <SignedOut>
              <SignInButton mode="modal">
                <button className="rounded-md bg-white/10 px-3 py-2 text-sm font-medium text-white hover:bg-white/20">
                  Sign In
                </button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <UserButton
                appearance={{ elements: { userButtonBox: 'text-white' } }}
              />
            </SignedIn>
          </div>
        </div>
      </div>
    </header>
  );
}
