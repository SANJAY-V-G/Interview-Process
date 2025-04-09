"use client"
import React from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
const UserPage = () => {
  return (
    <ProtectedRoute>
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">User Dashboard</h1>
        <p>Welcome to the user dashboard. All authenticated users can access this page.</p>
      </div>
    </ProtectedRoute>
  );
};

export default UserPage;
