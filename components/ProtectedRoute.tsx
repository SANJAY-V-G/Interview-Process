"use client"

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

type ProtectedRouteProps = {
  children: React.ReactNode;
  adminRequired?: boolean;
};

export default function ProtectedRoute({ 
  children, 
  adminRequired = false 
}: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace('/login');
      } else if (adminRequired && !user.isAdmin && !user.isTempAdmin) {
        router.replace('/user');
      }
    }
  }, [user, loading, adminRequired, router]);

  // Show loading state or nothing while checking authentication
  if (loading || !user || (adminRequired && !user.isAdmin && !user.isTempAdmin)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // If authenticated and has required permissions, render children
  return <>{children}</>;
}