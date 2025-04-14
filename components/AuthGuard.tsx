'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';

const publicPaths = ['/login', '/signup', '/forgot-password'];
const tempAdminBasePaths = ['/tempadmin', '/admin', '/Terms', '/adminedit'];
const userBasePaths = ['/user', '/UTerms'];
const adminBasePaths = ['/adminsearch', '/admin', '/Terms', '/adminedit'];

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);

  const isPathAllowed = (pathname: string, allowedPaths: string[]) => {
    return allowedPaths.some(base => pathname.startsWith(base));
  };

  const forceLogout = async () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
      if (typeof logout === 'function') await logout();
    } catch (err) {
      console.error('Logout failed:', err);
    }
    window.location.href = '/login';
  };

  useEffect(() => {
    if (authLoading) {
      setIsChecking(true);
      return;
    }

    const pathIsPublic = publicPaths.includes(pathname);
    let redirectPath: string | null = null;

    if (!user) {
      if (!pathIsPublic) {
        redirectPath = '/login';
      }
    } else {
      const { isAdmin, isTempAdmin } = user;

      if (pathIsPublic) {
        if (isAdmin) redirectPath = '/adminsearch';
        else if (isTempAdmin) redirectPath = '/tempadmin';
        else redirectPath = '/user';
      } else {
        // Admin access
        if (isAdmin && !isPathAllowed(pathname, adminBasePaths)) {
          console.log(`Admin unauthorized access to ${pathname}`);
          (async () => await forceLogout())();
          return;
        }

        // Temp Admin access
        if (isTempAdmin && !isPathAllowed(pathname, tempAdminBasePaths)) {
          console.log(`TempAdmin unauthorized access to ${pathname}`);
          (async () => await forceLogout())();
          return;
        }

        // Regular user access
        if (!isAdmin && !isTempAdmin && !isPathAllowed(pathname, userBasePaths)) {
          console.log(`User unauthorized access to ${pathname}`);
          (async () => await forceLogout())();
          return;
        }
      }
    }

    if (redirectPath) {
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
