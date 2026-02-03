'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useAuthStore } from '@/store/authStore';

export default function SessionSync() {
  const { data: session, status } = useSession();
  const { setUser, logout } = useAuthStore();

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      // Sync NextAuth session to authStore
      const avatarUrl = session.user.image || (session.user as any)?.avatar?.url;
      const user = {
        id: session.user.id,
        email: session.user.email || '',
        firstName: session.user.name?.split(' ')[0] || '',
        lastName: session.user.name?.split(' ')[1] || '',
        role: session.user.role,
        avatar: avatarUrl ? { url: avatarUrl } : undefined,
      };
      
      setUser(user as any, session.accessToken || '');
    }
    // Don't logout on 'unauthenticated' - user might be logged in via local auth
  }, [session, status, setUser]);

  return null;
}
