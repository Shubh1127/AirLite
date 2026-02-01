'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { format } from 'date-fns';
import Link from 'next/link';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export default function ReservationsPage() {
  const router = useRouter();
  const { isAuthenticated, hasHydrated, token } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [reservations, setReservations] = useState<any[]>([]);

  useEffect(() => {
    if (!hasHydrated) return;

    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }

    const fetchReservations = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE_URL}/api/users/me/trips`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch reservations');
        }

        const data = await response.json();
        setReservations(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Error fetching reservations:', error);
        setReservations([]);
      } finally {
        setLoading(false);
      }
    };

    fetchReservations();
  }, [hasHydrated, isAuthenticated, router, token]);

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
      <h1 className="text-3xl font-bold mb-8">Your Reservations</h1>
      
      {reservations.length === 0 ? (
        <div className="bg-white border border-neutral-200 rounded-2xl p-12 text-center">
          <p className="text-neutral-600 text-lg">No reservations yet</p>
          <Link href="/" className="mt-4 inline-block text-rose-500 hover:underline">
            Browse listings
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {reservations.map((reservation) => {
            const listing = reservation.listing || {};
            const checkIn = reservation.checkInDate ? new Date(reservation.checkInDate) : null;
            const checkOut = reservation.checkOutDate ? new Date(reservation.checkOutDate) : null;
            const totalGuests = (reservation.adults || 0) + (reservation.children || 0);

            return (
              <div
                key={reservation._id}
                className="bg-white border border-neutral-200 rounded-2xl p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Listing Image */}
                  <div className="w-full md:w-64 h-48 rounded-xl overflow-hidden bg-neutral-100 flex-shrink-0">
                    <img
                      src={
                        listing.images?.[0]?.url ||
                        'https://via.placeholder.com/400x300'
                      }
                      alt={listing.title || 'Listing'}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Reservation Details */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-semibold text-neutral-900">
                          {listing.title || 'Listing'}
                        </h3>
                        <p className="text-sm text-neutral-600">
                          {listing.location}
                          {listing.country ? `, ${listing.country}` : ''}
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          reservation.status === 'confirmed'
                            ? 'bg-green-100 text-green-700'
                            : reservation.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-700'
                            : reservation.status === 'cancelled'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {reservation.status || 'pending'}
                      </span>
                    </div>

                    {/* Dates and Guests */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-neutral-500 font-semibold uppercase mb-1">
                          Check-in
                        </p>
                        <p className="text-sm font-medium">
                          {checkIn ? format(checkIn, 'EEEE, d MMMM yyyy') : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-neutral-500 font-semibold uppercase mb-1">
                          Check-out
                        </p>
                        <p className="text-sm font-medium">
                          {checkOut ? format(checkOut, 'EEEE, d MMMM yyyy') : 'N/A'}
                        </p>
                      </div>
                    </div>

                    {/* Guests Info */}
                    <div className="mb-4">
                      <p className="text-xs text-neutral-500 font-semibold uppercase mb-1">
                        Guests
                      </p>
                      <p className="text-sm">
                        {totalGuests} {totalGuests === 1 ? 'guest' : 'guests'}
                        {reservation.infants > 0 &&
                          `, ${reservation.infants} ${
                            reservation.infants === 1 ? 'infant' : 'infants'
                          }`}
                        {reservation.pets > 0 &&
                          `, ${reservation.pets} ${
                            reservation.pets === 1 ? 'pet' : 'pets'
                          }`}
                      </p>
                    </div>

                    {/* Guest Message */}
                    {reservation.guestMessage && (
                      <div className="mb-4 p-3 bg-neutral-50 rounded-lg">
                        <p className="text-xs text-neutral-500 font-semibold uppercase mb-1">
                          Your message
                        </p>
                        <p className="text-sm text-neutral-700">
                          {reservation.guestMessage}
                        </p>
                      </div>
                    )}

                    {/* Price */}
                    <div className="pt-4 border-t border-neutral-200">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-neutral-600">Total amount</span>
                        <span className="text-2xl font-bold text-neutral-900">
                          ₹{Number(reservation.totalAmount || 0).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Booking Date */}
                    {reservation.createdAt && (
                      <p className="text-xs text-neutral-500 mt-3">
                        Booked on {format(new Date(reservation.createdAt), 'd MMM yyyy, h:mm a')}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
