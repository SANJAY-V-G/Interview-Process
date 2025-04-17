"use client"

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Eye, EyeOff } from 'lucide-react';

// Helper function to set cookies (consider security implications like HttpOnly if possible via backend)
function setCookie(name: string, value: string, days: number) {
  let expires = "";
  if (days) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    expires = "; expires=" + date.toUTCString();
  }
  // Ensure Secure flag is used if served over HTTPS; adjust SameSite as needed
  document.cookie = name + "=" + (value || "") + expires + "; path=/; SameSite=Lax"; 
}

const Login: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: '', 
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const [rememberMe, setRememberMe] = useState(false);
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
  
    try {
      const response = await fetch('https://backend-0728.onrender.com/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
  
      const data = await response.json();
  
      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }
  
      // 1. Update AuthContext state and localStorage
      login({
        username: data.username,
        isAdmin: data.isAdmin,
        isTempAdmin: data.isTempAdmin,
        token: data.token,
      });

      // 2. Set cookies for middleware (Set expiry as needed, e.g., 1 day)
      if (data.token) {
        setCookie('authToken', data.token, 1); 
      }
      setCookie('isAdmin', String(data.isAdmin), 1);
      setCookie('isTempAdmin', String(data.isTempAdmin), 1);

      // 3. Redirect based on role
      if (data.isAdmin && !data.isTempAdmin) {
        router.push('/adminsearch');
      } else if (data.isTempAdmin) {
        router.push('/tempadmin');

      
      }
      else{
        router.push('/user');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
     <div className="bg-white rounded-2xl shadow-xl flex flex-col md:flex-row max-w-4xl w-full overflow-hidden">
        {/* Left side with illustration */}
        <div className="md:w-1/2  flex items-center justify-center bg-blue-50">
          <img 
            src="/chennai-institute-of-technology.jpg"  // Update this path to match your file
            alt="Chennai Institute of Technology"
            className="max-w-full h-auto rounded-lg"
          />
        </div>

        {/* Right side with login form */}
        <div className="md:w-1/2 p-8">
          <h2 className="text-3xl font-bold mb-8">Log In</h2>
          
          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
              {error}
            </div>
          )}
          
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Username field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Username
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                placeholder="Enter your username"
                required
              />
            </div>

            {/* Password field */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ?<EyeOff size={20} /> : <Eye size={20} /> }
                </button>
              </div>
            </div>

            

            {/* Login button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition duration-200 font-medium disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? 'Logging in...' : 'Log In'}
            </button>
          </form>

          {/* Sign up link */}
          <p className="mt-8 text-center text-sm text-gray-600">
            Don't have an account?{' '}
            <Link href="/signup" className="font-medium text-blue-600 hover:text-blue-500">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;