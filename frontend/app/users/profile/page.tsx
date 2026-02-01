'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { formatDistanceToNow } from 'date-fns';

export default function AboutMePage() {
  const router = useRouter();
  const { user, isAuthenticated, hasHydrated, token } = useAuthStore();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  useEffect(() => {
    if (!hasHydrated) return;

    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }

    setProfile(user);
    setLoading(false);
  }, [hasHydrated, isAuthenticated, router, user]);

  useEffect(() => {
    if (!hasHydrated || !isAuthenticated || !token) return;

    const fetchReviews = async () => {
      setLoadingReviews(true);
      try {
        const response = await fetch(`${API_BASE_URL}/api/users/me/reviews`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch reviews');
        }

        const data = await response.json();
        setReviews(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Error fetching reviews:', error);
        setReviews([]);
      } finally {
        setLoadingReviews(false);
      }
    };

    fetchReviews();
  }, [API_BASE_URL, hasHydrated, isAuthenticated, token]);

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
    <div>
                <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">About me</h1>
        <Link href="/users/profile/edit" className="px-6 py-2 border border-neutral-300 rounded-lg hover:bg-gray-50 transition">
          Edit
        </Link>
      </div>

      {/* Profile Card */}
      <div className="bg-white border border-neutral-200 rounded-2xl p-8 mb-8">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-32 h-32 rounded-full bg-neutral-900 text-white text-4xl font-bold flex items-center justify-center mb-4 overflow-hidden">
            {
              user?.avatar?.url ? <img src={user.avatar.url} alt="Profile" className="w-full h-full object-cover rounded-full" /> : `${profile?.firstName?.[0] || 'U'}`
            }
            
          </div>
          <h2 className="text-2xl font-bold mb-1">
            {profile?.firstName} {profile?.lastName}
          </h2>
          <p className="text-neutral-600 mb-4">{profile?.role === 'both' ? 'Host & Guest' : profile?.role}</p>
        </div>

        {/* Profile Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t pt-6">
          <div>
            <label className="block text-sm font-semibold text-neutral-900 mb-2">Email</label>
            <p className="text-neutral-600">{profile?.email}</p>
          </div>

          {profile?.phone && (
            <div>
              <label className="block text-sm font-semibold text-neutral-900 mb-2">Phone</label>
              <p className="text-neutral-600">{profile.phone}</p>
            </div>
          )}

          {profile?.gender && (
            <div>
              <label className="block text-sm font-semibold text-neutral-900 mb-2">Gender</label>
              <p className="text-neutral-600">{profile.gender}</p>
            </div>
          )}

          {profile?.dateOfBirth && (
            <div>
              <label className="block text-sm font-semibold text-neutral-900 mb-2">Date of birth</label>
              <p className="text-neutral-600">
                {new Date(profile.dateOfBirth).toLocaleDateString()}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Additional Info */}
      <div className="bg-white border border-neutral-200 rounded-2xl p-8">
        <h3 className="text-xl font-bold mb-6">Complete your profile</h3>
        <p className="text-neutral-600 mb-6">
          Your Airbnb profile is an important part of every reservation. Create yours to help other hosts and guests get to know you.
        </p>
        <Link href="/users/profile/edit" className="px-6 py-3 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition inline-block font-medium">
          Get started
        </Link>
      </div>

      {/* Reviews Section */}
      <div className="mt-8">
        <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
          <span>⭐</span> Reviews I've written
        </h3>
        {loadingReviews ? (
          <div className="bg-white border border-neutral-200 rounded-2xl p-8 text-center">
            <p className="text-neutral-600">Loading reviews...</p>
          </div>
        ) : reviews.length === 0 ? (
          <div className="bg-white border border-neutral-200 rounded-2xl p-8 text-center">
            <p className="text-neutral-600">No reviews yet</p>
          </div>
        ) : (
          <div className="space-y-6">
            {reviews.map((review) => {
              const listing = review.listing || {};
              const timeAgo = review.createdAt
                ? formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })
                : 'Recently';

              return (
                <div
                  key={review._id}
                  className="bg-white border border-neutral-200 rounded-2xl p-6"
                >
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="w-full md:w-36 h-28 rounded-xl overflow-hidden bg-neutral-100">
                      <img
                        src={
                          listing.images?.[0]?.url ||
                          'https://via.placeholder.com/300x200'
                        }
                        alt={listing.title || 'Listing'}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h4 className="font-semibold text-neutral-900">
                            {listing.title || 'Listing'}
                          </h4>
                          <p className="text-sm text-neutral-600">
                            {listing.location}
                            {listing.country ? `, ${listing.country}` : ''}
                          </p>
                        </div>
                        <span className="text-xs text-neutral-500">{timeAgo}</span>
                      </div>

                      <div className="flex items-center gap-2 mb-2">
                        {[...Array(5)].map((_, i) => (
                          <span
                            key={i}
                            className={`text-sm ${
                              i < Math.floor(review.rating || 0)
                                ? 'text-black'
                                : 'text-neutral-300'
                            }`}
                          >
                            ★
                          </span>
                        ))}
                        <span className="text-sm text-neutral-600">
                          {review.rating ? review.rating.toFixed(1) : '0.0'}
                        </span>
                      </div>

                      <p className="text-sm text-neutral-700">
                        {review.comment}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

