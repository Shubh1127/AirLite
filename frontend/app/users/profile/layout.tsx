'use client';

import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { useEffect } from 'react';

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, hasHydrated ,user} = useAuthStore();

  console.log("User role in layout:", user?.role);

  useEffect(() => {
    if (!hasHydrated) return;

    if (!isAuthenticated) {
      router.push('/auth/login');
    }
  }, [hasHydrated, isAuthenticated, router]);

  if (!hasHydrated || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  const isActive = (path: string) => pathname === path;

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1  md:grid-cols-4 gap-8">
          {/* Left Sidebar */}
          <div className="hidden  md:block md:col-span-1">
            <nav className="space-y-4 sticky top-12 self-start">
              <Link
                href="/users/profile"
                className={`block text-left px-4 py-3 rounded-lg w-full transition ${
                  isActive('/users/profile')
                    ? 'bg-gray-100 font-semibold'
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span>👤</span> About me
                </div>
              </Link>

              <Link
                href="/users/profile/past-trips"
                className={`block text-left px-4 py-3 rounded-lg w-full transition ${
                  isActive('/users/profile/past-trips')
                    ? 'bg-gray-100 font-semibold'
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span>✈️</span> Trips
                </div>
              </Link>

              <Link
                href="/users/profile/reservation"
                className={`block text-left px-4 py-3 rounded-lg w-full transition ${
                  isActive('/users/profile/reservation')
                    ? 'bg-gray-100 font-semibold'
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span>👥</span> Upcoming
                </div>
              </Link>
              {
                (user?.role === 'host' || user?.role === 'both') && (
                  <Link
                    href="/users/profile/listings"
                    className={`block text-left px-4 py-3 rounded-lg w-full transition ${
                      isActive('/users/profile/listings')
                        ? 'bg-gray-100 font-semibold'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span>🏠</span> Listings
                    </div>
                  </Link>
                )
              }
            </nav>
          </div>

          {/* Main Content */}
          <div className="md:col-span-3">
            {children}
          </div>
        </div>
      </div>
    </main>
  );
}
