'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { format } from 'date-fns';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export default function TripsPage() {
  const { token, isAuthenticated } = useAuthStore();
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      setLoading(false);
      return;
    }

    const fetchTrips = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE_URL}/api/users/me/trips`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch trips');
        }

        const data = await response.json();
        setTrips(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Error fetching trips:', error);
        setTrips([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTrips();
  }, [isAuthenticated, token]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">My Trips</h1>
      {loading ? (
        <p className="text-gray-500">Loading trips...</p>
      ) : trips.length === 0 ? (
        <p className="text-gray-500">No trips booked yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trips.map((trip) => {
            const listing = trip.listing || {};
            const checkIn = trip.checkInDate ? new Date(trip.checkInDate) : null;
            const checkOut = trip.checkOutDate ? new Date(trip.checkOutDate) : null;

            return (
              <div
                key={trip._id}
                className="border rounded-lg overflow-hidden shadow-md"
              >
                <img
                  src={
                    listing.images?.[0]?.url ||
                    'https://via.placeholder.com/400x300'
                  }
                  alt={listing.title || 'Listing'}
                  className="w-full h-48 object-cover"
                />
                <div className="p-4">
                  <h3 className="font-semibold text-lg">
                    {listing.title || 'Listing'}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    {checkIn && checkOut
                      ? `${format(checkIn, 'd MMM')} - ${format(
                          checkOut,
                          'd MMM yyyy'
                        )}`
                      : 'Dates not available'}
                  </p>
                  <p className="text-gray-600 text-sm">
                    {listing.location}
                    {listing.country ? `, ${listing.country}` : ''}
                  </p>
                  <div className="flex items-center justify-between mt-3">
                    <p className="font-bold text-lg">
                      ₹{Number(trip.totalAmount || 0).toLocaleString()}
                    </p>
                    <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                      {trip.status || 'pending'}
                    </span>
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
