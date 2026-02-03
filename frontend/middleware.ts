import { withAuth } from 'next-auth/middleware';
import type { NextRequestWithAuth } from 'next-auth/middleware';

export const middleware = withAuth(
  function middleware(request: NextRequestWithAuth) {
    // Allow all requests to pass through
    // Individual pages will handle their own redirects
    return undefined;
  },
  {
    callbacks: {
      authorized: ({ token }) => {
        // Allow all users (authenticated and unauthenticated)
        return true;
      },
    },
    pages: {
      signIn: '/auth/login',
    },
  }
);

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/users/:path*',
  ],
};
