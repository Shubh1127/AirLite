'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import SecuritySettings from '@/components/profile/SecuritySettings';
import { motion } from 'framer-motion';

export default function ProfileSettingsPage() {
  const router = useRouter();
  const { isAuthenticated, hasHydrated } = useAuthStore();

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

  return (
    <motion.main
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 26, stiffness: 260 }}
      className="min-h-screen bg-white"
    >
      {/* Mobile Back Button */}
      <div className="lg:hidden sticky top-0 bg-white border-b border-neutral-200 px-4 py-3 flex items-center gap-3 z-10">
        <Link href="/users/profile" className="p-2 hover:bg-neutral-100 rounded-full transition">
          <ChevronLeft className="w-6 h-6" />
        </Link>
        <h1 className="text-lg font-semibold">Security Settings</h1>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Desktop Back Button */}
        <div className="hidden lg:flex items-center gap-3 mb-8">
          <Link href="/users/profile" className="p-2 hover:bg-neutral-100 rounded-full transition border border-neutral-200">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Security Settings</h1>
            <p className="text-sm text-neutral-600">Manage your email verification and password</p>
          </div>
        </div>

        <SecuritySettings />
      </div>
    </motion.main>
  );
}
