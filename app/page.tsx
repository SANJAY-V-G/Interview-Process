'use client';

import { AuthProvider } from '../context/AuthContext';
import Link from 'next/link';

const HomePage = () => {
  return (
    <AuthProvider>
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Welcome to the Application</h1>
        <div className="flex flex-col space-y-2">
          <Link 
            href="/login"
            className="text-blue-500 hover:underline"
          >
            Login
          </Link>
          <Link 
            href="/signup"
            className="text-blue-500 hover:underline"
          >
            Sign Up
          </Link>
          <Link 
            href="/user"
            className="text-blue-500 hover:underline"
          >
            User Dashboard
          </Link>
          <Link 
            href="/admin"
            className="text-blue-500 hover:underline"
          >
            Admin Panel
          </Link>
        </div>
      </div>
    </AuthProvider>
  );
};

export default HomePage;