'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';

// Define paths accessible without login
const publicPaths = ['/login', '/signup'];
// Define base paths allowed for each role
const tempAdminBasePaths = ['/sup-home'];
const userBasePaths = ['/user'];
// Define base paths allowed for regular admins (adjust as needed)
// Admins can typically access their own routes AND potentially user routes, but not temp admin routes.
const adminBasePaths = ['/adminsearch', '/admin', '/Terms', '/adminedit']; 

// Helper function to check if current path starts with any allowed base path
const isPathAllowed = (pathname: string, allowedBasePaths: string[]): boolean => {
  return allowedBasePaths.some(basePath => pathname.startsWith(basePath));
};

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  // State to manage whether the initial check is complete and access is granted
  const [isChecking, setIsChecking] = useState(true); 

  useEffect(() => {
    // Don't run checks until auth state is loaded
    if (authLoading) {
      setIsChecking(true); // Still checking
      return;
    }

    const pathIsPublic = isPathAllowed(pathname, publicPaths);
    let redirectPath: string | null = null;

    // --- Case 1: No user logged in ---
    if (!user) {
      if (!pathIsPublic) {
        console.log(`AuthGuard: Not logged in, accessing protected path (${pathname}). Redirecting to /login.`);
        redirectPath = '/login';
      }
      // If path IS public and no user, allow access (do nothing)
    } 
    // --- Case 2: User is logged in ---
    else {
      // If logged-in user tries to access public paths, redirect them
      if (pathIsPublic) {
        console.log(`AuthGuard: Logged in, accessing public path (${pathname}). Redirecting to dashboard.`);
        if (user.isAdmin) redirectPath = '/adminsearch'; // Or '/admin'
        else if (user.isTempAdmin) redirectPath = '/sup-home';
        else redirectPath = '/user';
      } 
      // Check role access for protected paths
      else {
        if (user.isTempAdmin) {
          if (!isPathAllowed(pathname, tempAdminBasePaths)) {
            console.log(`AuthGuard: TempAdmin accessing unauthorized path (${pathname}). Redirecting to /sup-home.`);
            redirectPath = '/sup-home';
          }
        } else if (user.isAdmin) {
          // Allow admins access to admin paths AND user paths, but NOT temp admin paths
          const allowedPathsForAdmin = [...adminBasePaths, ...userBasePaths]; 
          if (!isPathAllowed(pathname, allowedPathsForAdmin) || isPathAllowed(pathname, tempAdminBasePaths)) {
             console.log(`AuthGuard: Admin accessing unauthorized path (${pathname}). Redirecting to /adminsearch.`);
             redirectPath = '/adminsearch'; // Or '/admin'
          }
        } else { // Regular user
          if (!isPathAllowed(pathname, userBasePaths)) {
            console.log(`AuthGuard: User accessing unauthorized path (${pathname}). Redirecting to /user.`);
            redirectPath = '/user';
          }
        }
      }
    }

    // Perform redirection if needed
    if (redirectPath) {
      router.push(redirectPath);
      // Keep showing loading/checking state until redirect happens
      setIsChecking(true); 
    } else {
      // No redirect needed, checks passed, allow rendering
      setIsChecking(false); 
    }

  }, [user, authLoading, router, pathname]);

  // Show loading indicator while auth is loading OR if checks are still running/redirecting
  if (authLoading || isChecking) {
     return (
       <div className="min-h-screen flex items-center justify-center bg-gray-100">
         <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
       </div>
     );
  }

  // If checks pass and not loading, render the actual page content
  return <>{children}</>;
}