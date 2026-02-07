'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { Bell, Search, Heart, Home as HomeIcon, MessageCircle, User, Briefcase, CalendarCheck, ChevronLeft, LogOut, Shield, CheckCircle } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import SecuritySettings from '@/components/profile/SecuritySettings';

export default function AboutMePage() {
  const router = useRouter();
  const { user, isAuthenticated, hasHydrated, token, logout } = useAuthStore();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isProfileSheetOpen, setIsProfileSheetOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = () => {
    setIsLoggingOut(true);
    logout();
    router.push('/');
  };

  // console.log(user);
  // console.log(profile)

  useEffect(() => {
    if (!hasHydrated) return;

    if (!isAuthenticated && !isLoggingOut) {
      router.push('/auth/login');
      return;
    }

    setProfile(user);
    setLoading(false);
  }, [hasHydrated, isAuthenticated, router, user, isLoggingOut]);

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
          {(user?.isEmailVerified || user?.provider === 'google') && (
            <div className="flex items-center justify-center gap-1 mt-2 text-xs text-green-600">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Verified</span>
            </div>
          )}
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
        <Link href="/users/profile/wishlist" className="bg-white border border-neutral-200 rounded-2xl p-4 flex flex-col items-center gap-3 shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-neutral-100 flex items-center justify-center">
            <Heart className="w-6 h-6 text-neutral-700" />
          </div>
          <div className="text-sm font-semibold text-center">Wishlist</div>
        </Link>
        {(user?.role === 'host' || user?.role === 'both') && (
          <>
            <Link href="/users/profile/listings" className="bg-white border border-neutral-200 rounded-2xl p-4 flex flex-col items-center gap-3 shadow-sm">
              <div className="w-14 h-14 rounded-2xl bg-neutral-100 flex items-center justify-center">
                <HomeIcon className="w-6 h-6 text-neutral-700" />
              </div>
              <div className="text-sm font-semibold text-center">Listings</div>
            </Link>
            <Link href="/users/profile/host-profile" className="bg-white border border-neutral-200 rounded-2xl p-4 flex flex-col items-center gap-3 shadow-sm">
              <div className="w-14 h-14 rounded-2xl bg-neutral-100 flex items-center justify-center">
                <Briefcase className="w-6 h-6 text-neutral-700" />
              </div>
              <div className="text-sm font-semibold text-center">Host Profile</div>
            </Link>
          </>
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
        <Link href="/users/profile/settings" className="flex items-center justify-between py-2">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center">
              <Shield className="w-4 h-4 text-neutral-600" />
            </span>
            <span className="text-sm font-medium">Security settings</span>
          </div>
          <span className="text-neutral-400">›</span>
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-between py-2 text-red-600 hover:text-red-700 transition"
        >
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center">
              <LogOut className="w-4 h-4 text-red-600" />
            </span>
            <span className="text-sm font-medium">Logout</span>
          </div>
          <span className="text-red-600">›</span>
        </button>
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
                  {(user?.isEmailVerified || user?.provider === 'google') && (
                    <div className="flex items-center justify-center gap-1 mt-2 text-xs text-green-600">
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Verified</span>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-neutral-700">Email</span>
                    <div className="flex items-center gap-1">
                      <span className="text-sm text-neutral-500">{profile?.email || '-'}</span>
                      {(user?.isEmailVerified || user?.provider === 'google') && (
                        <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                      )}
                    </div>
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
      {/* Bottom Navigation Bar - Mobile Only */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200">
        <div className="h-16 flex items-center justify-center">
          {/* CENTERED NAV RAIL */}
          <div className="flex items-center justify-between w-full max-w-[360px] px-10">
            {/* Explore */}
            <button className="flex flex-col items-center gap-1">
              <Search className="w-5 h-5 text-rose-500" />
              <span className="text-xs font-medium text-rose-500">Explore</span>
            </button>

            {/* Wishlists */}

            <Link href={"users/profile/wishlist"}>
              <button className="flex flex-col items-center gap-1">
                <Heart className="w-5 h-5 text-neutral-600" />
                <span className="text-xs font-medium text-neutral-600">
                  Wishlists
                </span>
              </button>
            </Link>

            {/* Trips (conditional) */}
            {isAuthenticated && (
              <Link href={"users/profile/past-trips"}>
                <button className="flex flex-col items-center gap-1">
                  <HomeIcon className="w-5 h-5 text-neutral-600" />
                  <span className="text-xs font-medium text-neutral-600">
                    Trips
                  </span>
                </button>
              </Link>
            )}

            {/* Profile */}
            <Link href="/users/profile">
              <button className="flex flex-col items-center gap-1">
                <User className="w-5 h-5 text-neutral-600" />
                <span className="text-xs font-medium text-neutral-600">
                  Profile
                </span>
              </button>
            </Link>
          </div>
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
                <div className="flex items-center gap-3 mb-6">
                  <p className="text-neutral-600">{profile?.role === 'both' ? 'Host & Guest' : profile?.role}</p>
                  {(user?.isEmailVerified || user?.provider === 'google') && (
                    <div className="flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 rounded-md text-xs font-medium">
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Verified</span>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between py-3 border-b border-neutral-100">
                    <span className="text-sm font-medium text-neutral-700">Email</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-neutral-600">{profile?.email || '-'}</span>
                      {(user?.isEmailVerified || user?.provider === 'google') && (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      )}
                    </div>
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

          {/* Security Settings Section */}
          <div className="bg-white border border-neutral-200 rounded-2xl p-8 shadow-sm">
            <SecuritySettings />
          </div>

          {/* Quick Actions Section */}
          <div className="bg-white border border-neutral-200 rounded-2xl p-8 shadow-sm">
            <h3 className="text-xl font-semibold mb-6">Quick Actions</h3>
            <div className="space-y-4">
              <Link 
                href="/users/profile/edit" 
                className="flex items-center justify-between py-3 px-4 rounded-lg hover:bg-neutral-50 transition border border-neutral-200"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center">
                    <User className="w-5 h-5 text-neutral-600" />
                  </div>
                  <div>
                    <div className="font-medium">Edit Profile</div>
                    <div className="text-sm text-neutral-500">Update your personal information</div>
                  </div>
                </div>
                <span className="text-neutral-400">›</span>
              </Link>

              <Link 
                href="/users/profile/past-trips" 
                className="flex items-center justify-between py-3 px-4 rounded-lg hover:bg-neutral-50 transition border border-neutral-200"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center">
                    <Briefcase className="w-5 h-5 text-neutral-600" />
                  </div>
                  <div>
                    <div className="font-medium">Past Trips</div>
                    <div className="text-sm text-neutral-500">View your travel history</div>
                  </div>
                </div>
                <span className="text-neutral-400">›</span>
              </Link>

              <Link 
                href="/users/profile/reservation" 
                className="flex items-center justify-between py-3 px-4 rounded-lg hover:bg-neutral-50 transition border border-neutral-200"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center">
                    <CalendarCheck className="w-5 h-5 text-neutral-600" />
                  </div>
                  <div>
                    <div className="font-medium">Reservations</div>
                    <div className="text-sm text-neutral-500">Manage your bookings</div>
                  </div>
                </div>
                <span className="text-neutral-400">›</span>
              </Link>

              <Link 
                href="/users/profile/wishlist" 
                className="flex items-center justify-between py-3 px-4 rounded-lg hover:bg-neutral-50 transition border border-neutral-200"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center">
                    <Heart className="w-5 h-5 text-neutral-600" />
                  </div>
                  <div>
                    <div className="font-medium">Wishlist</div>
                    <div className="text-sm text-neutral-500">Your saved properties</div>
                  </div>
                </div>
                <span className="text-neutral-400">›</span>
              </Link>

              {(user?.role === 'host' || user?.role === 'both') && (
                <>
                  <Link 
                    href="/users/profile/listings" 
                    className="flex items-center justify-between py-3 px-4 rounded-lg hover:bg-neutral-50 transition border border-neutral-200"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center">
                        <HomeIcon className="w-5 h-5 text-neutral-600" />
                      </div>
                      <div>
                        <div className="font-medium">My Listings</div>
                        <div className="text-sm text-neutral-500">Manage your properties</div>
                      </div>
                    </div>
                    <span className="text-neutral-400">›</span>
                  </Link>

                  <Link 
                    href="/users/profile/host-profile" 
                    className="flex items-center justify-between py-3 px-4 rounded-lg hover:bg-neutral-50 transition border border-neutral-200"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center">
                        <Briefcase className="w-5 h-5 text-neutral-600" />
                      </div>
                      <div>
                        <div className="font-medium">Host Profile</div>
                        <div className="text-sm text-neutral-500">Update host information</div>
                      </div>
                    </div>
                    <span className="text-neutral-400">›</span>
                  </Link>
                </>
              )}

              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-between py-3 px-4 rounded-lg hover:bg-red-50 transition border border-red-200 text-red-600"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
                    <LogOut className="w-5 h-5 text-red-600" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium">Logout</div>
                    <div className="text-sm text-red-500">Sign out of your account</div>
                  </div>
                </div>
                <span className="text-red-600">›</span>
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
}

