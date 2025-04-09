import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Get the pathname of the request
  const path = request.nextUrl.pathname;
  
  // Define public paths that don't require authentication
  const isPublicPath = path === '/login' || path === '/signup';
  
  // Get the token from the cookies
  const token = request.cookies.get('authToken')?.value || '';
  
  // Get user role info from cookies (you'll need to set these cookies when user logs in)
  const isAdmin = request.cookies.get('isAdmin')?.value === 'true';
  const isTempAdmin = request.cookies.get('isTempAdmin')?.value === 'true';
  
  // Redirect logic
  if (isPublicPath && token) {
    // If user is logged in and tries to access login/signup page
    return NextResponse.redirect(new URL('/user', request.url));
  }
  
  if (!isPublicPath && !token) {
    // If user is not logged in and tries to access protected route
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  // Route-specific protections
  const adminOnlyPaths = ['/adminsearch'];
  const tempAdminOnlyPaths = ['/sup-home'];
  const adminOrTempAdminPaths = ['/admin', '/Terms', '/adminedit'];
  
  // Check if the path starts with any of the protected path prefixes
  const isAdminOnlyPath = adminOnlyPaths.some(prefix => path.startsWith(prefix));
  const isTempAdminOnlyPath = tempAdminOnlyPaths.some(prefix => path.startsWith(prefix));
  const isAdminOrTempAdminPath = adminOrTempAdminPaths.some(prefix => path.startsWith(prefix));
  
  if (isAdminOnlyPath && !isAdmin) {
    return NextResponse.redirect(new URL('/user', request.url));
  }
  
  if (isTempAdminOnlyPath && !isTempAdmin) {
    return NextResponse.redirect(new URL('/user', request.url));
  }
  
  if (isAdminOrTempAdminPath && !(isAdmin || isTempAdmin)) {
    return NextResponse.redirect(new URL('/user', request.url));
  }
  
  return NextResponse.next();
}

// Configure which paths should be checked by middleware
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
