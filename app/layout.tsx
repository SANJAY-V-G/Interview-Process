import React from 'react';
import { AuthProvider } from '@/context/AuthContext'; // Adjust path if needed
import './globals.css'; // Assuming you have global styles

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
