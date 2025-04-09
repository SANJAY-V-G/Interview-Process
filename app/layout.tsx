import { AuthProvider } from '@/context/AuthContext';
import './globals.css'; // Assuming you have global styles
import AuthGuard from '@/components/AuthGuard';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <AuthGuard>
          {children}
          </AuthGuard>
        </AuthProvider>
      </body>
    </html>
  );
}