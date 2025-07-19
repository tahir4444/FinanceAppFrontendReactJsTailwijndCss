import React, { memo } from 'react';
import Login from '../components/auth/Login.jsx';
import '../index.css';

const LoginPage = memo(() => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Simplified background - removed heavy SVG */}
      <div className="relative w-full max-w-md mx-auto p-8 bg-white rounded-xl shadow-lg border border-gray-200">
        {/* Logo and Tagline */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mb-3 shadow-md">
            <span className="text-white text-2xl font-bold">MF</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">
            Welcome Back
          </h2>
          <p className="text-gray-500 text-center">Sign in to your account</p>
        </div>
        {/* Login Form Container */}
        <Login />
        {/* Additional Links */}
        <div className="flex flex-col items-center mt-6 gap-2">
          <a
            href="/register"
            className="text-blue-600 hover:underline font-medium"
          >
            Create new account
          </a>
          <a
            href="/"
            className="text-xs text-gray-400 hover:text-blue-500 transition"
          >
            &larr; Back to Home
          </a>
        </div>
      </div>
    </div>
  );
});

LoginPage.displayName = 'LoginPage';

export default LoginPage;
