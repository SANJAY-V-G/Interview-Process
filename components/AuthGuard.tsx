'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';

// Define paths accessible without login
const publicPaths = ['/login', '/signup', '/forgot-password'];
// Define base paths allowed for each role
const tempAdminBasePaths = ['/tempadmin','/Admin', '/Terms', '/adminedit'];
const userBasePaths = ['/user', '/UTerms'];
const adminBasePaths = ['/adminsearch', '/Admin', '/Terms', '/adminedit']; 

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);

  // Enhanced path checking function
  const isPathAllowed = (pathname: string, allowedBasePaths: string[]): boolean => {
    return allowedBasePaths.some(basePath => pathname.startsWith(basePath));
  };

  // Comprehensive logout and redirect function
  const forceLogout = async () => {
    try {
      // Clear client-side storage
      localStorage.clear();
      sessionStorage.clear();
      
      // Call auth context logout if available
      if (typeof logout === 'function') {
        await logout();
      }
      
      // Force full page reload to reset all state
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout failed:', error);
      window.location.href = '/login';
    }
  };

  useEffect(() => {
    if (authLoading) {
      setIsChecking(true);
      return;
    }

    const pathIsPublic = publicPaths.includes(pathname);
    let shouldLogout = false;
    let redirectPath: string | null = null;

    // Case 1: No user logged in
    if (!user) {
      if (!pathIsPublic) {
        console.log(`AuthGuard: Not logged in, accessing protected path (${pathname})`);
        redirectPath = '/login';
      }
    } 
    // Case 2: User is logged in
    else {
      // Check if accessing public path while logged in
      if (pathIsPublic) {
        console.log(`AuthGuard: Logged in, accessing public path (${pathname})`);
        if (user.isAdmin) redirectPath = '/adminsearch';
        else if (user.isTempAdmin) redirectPath = '/tempadmin';
        else redirectPath = '/user';
      }
      // Check role-based access for protected paths
      else {
        if (user.isTempAdmin && !isPathAllowed(pathname, tempAdminBasePaths)) {
          console.log(`AuthGuard: TempAdmin unauthorized access (${pathname})`);
          shouldLogout = true;
        } else if (user.isAdmin && 
                  (!isPathAllowed(pathname, [...adminBasePaths, ...userBasePaths]) || 
                   isPathAllowed(pathname, tempAdminBasePaths))) {
          console.log(`AuthGuard: Admin unauthorized access (${pathname})`);
          shouldLogout = true;
        } else if (!user.isAdmin && !user.isTempAdmin && !isPathAllowed(pathname, userBasePaths)) {
          console.log(`AuthGuard: User unauthorized access (${pathname})`);
          shouldLogout = true;
        }
      }
    }

    // Handle unauthorized access with full logout
    if (shouldLogout) {
      forceLogout();
      return;
    }

    // Handle regular redirects
    if (redirectPath) {
      // Use replace instead of push to prevent back navigation
      router.replace(redirectPath);
    } else {
      setIsChecking(false);
    }
  }, [user, authLoading, router, pathname]);

  if (authLoading || isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return <>{children}</>;
}