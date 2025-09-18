import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import ProtectedRoute from './components/ProtectedRoute';
import HomePage from './pages/HomePage';
import PublicPage from './pages/PublicPage';
import AboutPage from './pages/AboutPage';
import ProtectedPage from './pages/ProtectedPage';
import LoginPage from './pages/LoginPage';
import AccountPage from './pages/AccountPage';

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/public" element={<PublicPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route
            path="/protected"
            element={
              <ProtectedRoute>
                <ProtectedPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/account"
            element={
              <ProtectedRoute>
                <AccountPage />
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<LoginPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <footer className="p-6 text-center text-gray-500 text-sm">
        Demo app with Clerk + React Router + Vite
      </footer>
    </div>
  );
}
