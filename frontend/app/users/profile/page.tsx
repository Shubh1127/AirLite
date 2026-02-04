'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { Bell, Search, Heart, Home as HomeIcon, MessageCircle, User, Briefcase, CalendarCheck, ChevronLeft } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

export default function AboutMePage() {
  const router = useRouter();
  const { user, isAuthenticated, hasHydrated, token } = useAuthStore();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isProfileSheetOpen, setIsProfileSheetOpen] = useState(false);

  useEffect(() => {
    if (!hasHydrated) return;

    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }

    setProfile(user);
    setLoading(false);
  }, [hasHydrated, isAuthenticated, router, user]);

  if (loading || !hasHydrated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      {/* Mobile View */}
      <div className="lg:hidden min-h-screen bg-white pb-24">
        <div className="px-5 pt-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Profile</h1>
          <button className="w-10 h-10 rounded-full border border-neutral-200 flex items-center justify-center">
            <Bell className="w-5 h-5 text-neutral-700" />
          </button>
        </div>

        <button
          type="button"
          onClick={() => setIsProfileSheetOpen(true)}
          className="w-full bg-white border border-neutral-200 rounded-2xl p-6 text-center shadow-sm"
        >
          <div className="w-20 h-20 rounded-full bg-neutral-900 text-white text-3xl font-bold flex items-center justify-center mx-auto mb-3 overflow-hidden">
            {user?.avatar?.url ? (
              <img src={user.avatar.url} alt="Profile" className="w-full h-full object-cover rounded-full" />
            ) : (
              `${profile?.firstName?.[0] || 'U'}`
            )}
          </div>
          <h2 className="text-xl font-bold">{profile?.firstName} {profile?.lastName}</h2>
          <p className="text-sm text-neutral-500">{profile?.role === 'both' ? 'Host & Guest' : profile?.role}</p>
        </button>
      </div>

      <div className="px-5 mt-5 grid grid-cols-2 gap-4">
        <Link href="/users/profile/past-trips" className="bg-white border border-neutral-200 rounded-2xl p-4 flex flex-col items-center gap-3 shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-neutral-100 flex items-center justify-center">
            <Briefcase className="w-6 h-6 text-neutral-700" />
          </div>
          <div className="text-sm font-semibold text-center">Past trips</div>
        </Link>
        <Link href="/users/profile/reservation" className="bg-white border border-neutral-200 rounded-2xl p-4 flex flex-col items-center gap-3 shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-neutral-100 flex items-center justify-center">
            <CalendarCheck className="w-6 h-6 text-neutral-700" />
          </div>
          <div className="text-sm font-semibold text-center">Reservations</div>
        </Link>
        {(user?.role === 'host' || user?.role === 'both') && (
          <Link href="/users/profile/listings" className="bg-white border border-neutral-200 rounded-2xl p-4 flex flex-col items-center gap-3 shadow-sm">
            <div className="w-14 h-14 rounded-2xl bg-neutral-100 flex items-center justify-center">
              <HomeIcon className="w-6 h-6 text-neutral-700" />
            </div>
            <div className="text-sm font-semibold text-center">Listings</div>
          </Link>
        )}
      </div>

      {user?.role === 'guest' && (
        <div className="px-5 mt-4">
          <Link href="/become-a-host" className="bg-white border border-neutral-200 rounded-2xl p-4 flex items-center gap-4 shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-neutral-100 flex items-center justify-center">
              <HomeIcon className="w-6 h-6 text-neutral-700" />
            </div>
            <div>
              <div className="font-semibold">Become a host</div>
              <div className="text-xs text-neutral-500">It's easy to start hosting and earn extra income.</div>
            </div>
          </Link>
        </div>
      )}

      <div className="px-5 mt-6 space-y-4">
        <Link href="/users/profile/edit" className="flex items-center justify-between py-2">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center">
              <User className="w-4 h-4 text-neutral-600" />
            </span>
            <span className="text-sm font-medium">Account settings</span>
          </div>
          <span className="text-neutral-400">›</span>
        </Link>
      </div>

      <AnimatePresence>
        {isProfileSheetOpen && (
          <motion.div
            className="fixed inset-0 z-50 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div
              className="absolute inset-0 bg-black/20"
              onClick={() => setIsProfileSheetOpen(false)}
            />
            <motion.div
              className="absolute inset-y-0 right-0 w-full bg-white"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 260 }}
            >
              <div className="px-5 pt-6 pb-4 border-b border-neutral-200 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setIsProfileSheetOpen(false)}
                  className="w-10 h-10 rounded-full border border-neutral-200 flex items-center justify-center"
                >
                  <ChevronLeft className="w-5 h-5 text-neutral-700" />
                </button>
                <Link href="/users/profile/edit" className="px-4 py-2 text-sm font-semibold rounded-full border border-neutral-200">
                  Edit
                </Link>
              </div>

              <div className="px-5 py-6">
                <div className="bg-white border border-neutral-200 rounded-2xl p-6 text-center shadow-sm mb-6">
                  <div className="w-20 h-20 rounded-full bg-neutral-900 text-white text-3xl font-bold flex items-center justify-center mx-auto mb-3 overflow-hidden">
                    {user?.avatar?.url ? (
                      <img src={user.avatar.url} alt="Profile" className="w-full h-full object-cover rounded-full" />
                    ) : (
                      `${profile?.firstName?.[0] || 'U'}`
                    )}
                  </div>
                  <h2 className="text-xl font-bold">{profile?.firstName} {profile?.lastName}</h2>
                  <p className="text-sm text-neutral-500">{profile?.role === 'both' ? 'Host & Guest' : profile?.role}</p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-neutral-700">Email</span>
                    <span className="text-sm text-neutral-500">{profile?.email || '-'}</span>
                  </div>
                  {profile?.phone && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-neutral-700">Phone</span>
                      <span className="text-sm text-neutral-500">{profile.phone}</span>
                    </div>
                  )}
                  {profile?.gender && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-neutral-700">Gender</span>
                      <span className="text-sm text-neutral-500">{profile.gender}</span>
                    </div>
                  )}
                  {profile?.dateOfBirth && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-neutral-700">Date of birth</span>
                      <span className="text-sm text-neutral-500">
                        {new Date(profile.dateOfBirth).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200">
        <div className="flex items-center justify-around h-16">
          <Link href="/" className="flex flex-col items-center justify-center gap-1 flex-1 h-full hover:bg-neutral-50 transition">
            <Search className="w-5 h-5 text-neutral-600" />
            <span className="text-xs font-medium text-neutral-600">Explore</span>
          </Link>
          <button className="flex flex-col items-center justify-center gap-1 flex-1 h-full hover:bg-neutral-50 transition">
            <Heart className="w-5 h-5 text-neutral-600" />
            <span className="text-xs font-medium text-neutral-600">Wishlists</span>
          </button>
          <button className="flex flex-col items-center justify-center gap-1 flex-1 h-full hover:bg-neutral-50 transition">
            <HomeIcon className="w-5 h-5 text-neutral-600" />
            <span className="text-xs font-medium text-neutral-600">Trips</span>
          </button>
          <button className="flex flex-col items-center justify-center gap-1 flex-1 h-full hover:bg-neutral-50 transition">
            <MessageCircle className="w-5 h-5 text-neutral-600" />
            <span className="text-xs font-medium text-neutral-600">Messages</span>
          </button>
          <Link href="/users/profile" className="flex flex-col items-center justify-center gap-1 flex-1 h-full hover:bg-neutral-50 transition">
            <User className="w-5 h-5 text-rose-500" />
            <span className="text-xs font-medium text-rose-500">Profile</span>
          </Link>
        </div>
      </nav>

    </div>

      {/* Desktop View - About Me */}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 26, stiffness: 260 }}
        className="hidden lg:block"
      >
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-semibold mb-2">About {profile?.firstName}</h1>
            <p className="text-neutral-600">Manage your profile and preferences</p>
          </div>

          <div className="bg-white border border-neutral-200 rounded-2xl p-8 shadow-sm">
            <div className="flex items-start gap-8">
              <div className="w-32 h-32 rounded-full bg-neutral-900 text-white text-4xl font-bold flex items-center justify-center overflow-hidden flex-shrink-0">
                {user?.avatar?.url ? (
                  <img src={user.avatar.url} alt="Profile" className="w-full h-full object-cover rounded-full" />
                ) : (
                  `${profile?.firstName?.[0] || 'U'}`
                )}
              </div>

              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-2">{profile?.firstName} {profile?.lastName}</h2>
                <p className="text-neutral-600 mb-6">{profile?.role === 'both' ? 'Host & Guest' : profile?.role}</p>

                <div className="space-y-4">
                  <div className="flex items-center justify-between py-3 border-b border-neutral-100">
                    <span className="text-sm font-medium text-neutral-700">Email</span>
                    <span className="text-sm text-neutral-600">{profile?.email || '-'}</span>
                  </div>
                  {profile?.phone && (
                    <div className="flex items-center justify-between py-3 border-b border-neutral-100">
                      <span className="text-sm font-medium text-neutral-700">Phone</span>
                      <span className="text-sm text-neutral-600">{profile.phone}</span>
                    </div>
                  )}
                  {profile?.gender && (
                    <div className="flex items-center justify-between py-3 border-b border-neutral-100">
                      <span className="text-sm font-medium text-neutral-700">Gender</span>
                      <span className="text-sm text-neutral-600">{profile.gender}</span>
                    </div>
                  )}
                  {profile?.dateOfBirth && (
                    <div className="flex items-center justify-between py-3 border-b border-neutral-100">
                      <span className="text-sm font-medium text-neutral-700">Date of birth</span>
                      <span className="text-sm text-neutral-600">
                        {new Date(profile.dateOfBirth).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>

                <div className="mt-6">
                  <Link
                    href="/users/profile/edit"
                    className="inline-block px-6 py-3 bg-neutral-900 text-white rounded-lg font-medium hover:bg-neutral-800 transition"
                  >
                    Edit profile
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {profile?.profile?.intro && (
            <div className="bg-white border border-neutral-200 rounded-2xl p-8 shadow-sm">
              <h3 className="text-xl font-semibold mb-4">About me</h3>
              <p className="text-neutral-700">{profile.profile.intro}</p>
            </div>
          )}

          {profile?.profile?.interests && profile.profile.interests.length > 0 && (
            <div className="bg-white border border-neutral-200 rounded-2xl p-8 shadow-sm">
              <h3 className="text-xl font-semibold mb-4">Interests</h3>
              <div className="flex flex-wrap gap-3">
                {profile.profile.interests.map((interest: string, idx: number) => (
                  <span
                    key={idx}
                    className="px-4 py-2 rounded-full border border-neutral-300 text-sm"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </>
  );
}

