'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isLogin = pathname === '/auth/login';

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50 flex items-center justify-center p-4">
      {/* Container with responsive max-width */}
      <div className={`w-full ${isLogin ? 'max-w-md' : 'max-w-6xl'}`}> {/* Wider for register */}
        
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-6">
            <div className="text-4xl font-bold text-red-500">◉</div>
            <div className="text-sm font-semibold text-gray-700">AirLite</div>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {isLogin ? 'Welcome back' : 'Join AirLite'}
          </h1>
          <p className="text-gray-600">
            {isLogin
              ? 'Sign in to your account to continue'
              : 'Create an account to get started'}
          </p>
        </div>

        {/* Form Container - Wider for register */}
        <div className={`bg-white rounded-2xl shadow-lg ${isLogin ? 'p-8' : 'p-6 md:p-8'}`}>
          {children}
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-sm text-gray-600">
          {isLogin ? (
            <>
              Don't have an account?{' '}
              <Link href="/auth/register" className="font-semibold text-red-500 hover:text-red-600 underline">
                Sign up
              </Link>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <Link href="/auth/login" className="font-semibold text-red-500 hover:text-red-600 underline">
                Sign in
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}