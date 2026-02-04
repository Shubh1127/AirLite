'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { reservationsAPI, Reservation } from '@/lib/reservations';
import { format } from 'date-fns';
import { Calendar, X, Edit, AlertCircle, CheckCircle, Clock, XCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function TripsPage() {
  const { token, isAuthenticated, hasHydrated } = useAuthStore();
  const router = useRouter();
  const [trips, setTrips] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTrip, setSelectedTrip] = useState<Reservation | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [cancellationReason, setCancellationReason] = useState('');
  const [editDates, setEditDates] = useState({ checkIn: '', checkOut: '' });
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!hasHydrated) return;

    if (!isAuthenticated || !token) {
      router.push("/auth/login");
      setLoading(false);
      return;
    }

    fetchTrips();
  }, [isAuthenticated, token, hasHydrated, router]);

  const fetchTrips = async () => {
    try {
      setLoading(true);
      const data = await reservationsAPI.getMyReservations(token!);
      setTrips(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching trips:', error);
      setTrips([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelReservation = async () => {
    if (!selectedTrip || !token) return;

    try {
      setActionLoading(true);
      setError('');
      await reservationsAPI.cancelReservation(selectedTrip._id, token, cancellationReason);
      setShowCancelModal(false);
      setCancellationReason('');
      await fetchTrips();
    } catch (err: any) {
      setError(err.message || 'Failed to cancel reservation');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditReservation = async () => {
    if (!selectedTrip || !token) return;

    try {
      setActionLoading(true);
      setError('');
      await reservationsAPI.editReservation(
        selectedTrip._id,
        token,
        editDates.checkIn,
        editDates.checkOut
      );
      setShowEditModal(false);
      setEditDates({ checkIn: '', checkOut: '' });
      await fetchTrips();
    } catch (err: any) {
      setError(err.message || 'Failed to edit reservation');
    } finally {
      setActionLoading(false);
    }
  };

  const openCancelModal = (trip: Reservation) => {
    setSelectedTrip(trip);
    setShowCancelModal(true);
    setError('');
  };

  const openEditModal = (trip: Reservation) => {
    setSelectedTrip(trip);
    setEditDates({
      checkIn: trip.checkInDate.split('T')[0],
      checkOut: trip.checkOutDate.split('T')[0],
    });
    setShowEditModal(true);
    setError('');
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      confirmed: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      cancelled: 'bg-red-100 text-red-800',
      completed: 'bg-blue-100 text-blue-800',
      'refund-pending': 'bg-orange-100 text-orange-800',
      refunded: 'bg-purple-100 text-purple-800',
    };
    return styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800';
  };

  const getRefundStatusIcon = (status: string) => {
    switch(status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'processing':
      case 'pending':
        return <Clock className="w-4 h-4 text-orange-600" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return null;
    }
  };

  if (!hasHydrated || loading) {
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
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">My Trips</h1>
      
      {loading ? (
        <p className="text-gray-500">Loading trips...</p>
      ) : trips.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">No trips booked yet.</p>
          <button
            onClick={() => router.push('/')}
            className="bg-rose-500 text-white px-6 py-2 rounded-lg hover:bg-rose-600"
          >
            Explore Listings
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trips.map((trip) => {
            const listing = trip.listing || {};
            const checkIn = new Date(trip.checkInDate);
            const checkOut = new Date(trip.checkOutDate);
            const isPast = checkOut < new Date();
            const canManage = trip.status === 'confirmed' && !isPast;

            return (
              <div
                key={trip._id}
                className="border rounded-lg overflow-hidden shadow-md hover:shadow-lg transition"
              >
                <div className="relative">
                  <img
                    src={listing.images?.[0]?.url || 'https://via.placeholder.com/400x300'}
                    alt={listing.title || 'Listing'}
                    className="w-full h-48 object-cover"
                  />
                  <span
                    className={`absolute top-3 right-3 text-xs px-3 py-1 rounded-full font-semibold ${getStatusBadge(trip.status)}`}
                  >
                    {trip.status}
                  </span>
                </div>
                
                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-2">{listing.title || 'Listing'}</h3>
                  
                  <div className="flex items-center gap-2 text-gray-600 text-sm mb-2">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {format(checkIn, 'd MMM')} - {format(checkOut, 'd MMM yyyy')}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-3">
                    {listing.location}
                    {listing.country ? `, ${listing.country}` : ''}
                  </p>

                  {/* Refund Information */}
                  {trip.refundAmount && trip.refundAmount > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                      <div className="flex items-center gap-2 mb-1">
                        {getRefundStatusIcon(trip.refundStatus || 'none')}
                        <span className="text-sm font-semibold text-blue-900">
                          Refund: {trip.refundPercentage}%
                        </span>
                      </div>
                      <p className="text-sm text-blue-700">
                        ₹{trip.refundAmount.toLocaleString()} - {trip.refundStatus}
                      </p>
                    </div>
                  )}

                  <div className="flex items-center justify-between mb-3">
                    <p className="font-bold text-lg">₹{trip.totalAmount.toLocaleString()}</p>
                  </div>

                  {/* Action Buttons */}
                  {canManage && (
                    <div className="flex gap-2">
                      {trip.canEdit && (
                        <button
                          onClick={() => openEditModal(trip)}
                          className="flex-1 flex items-center justify-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 text-sm"
                        >
                          <Edit className="w-4 h-4" />
                          Edit
                        </button>
                      )}
                      <button
                        onClick={() => openCancelModal(trip)}
                        className="flex-1 flex items-center justify-center gap-2 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 text-sm"
                      >
                        <X className="w-4 h-4" />
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Cancel Modal */}
      {showCancelModal && selectedTrip && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Cancel Reservation</h2>
              <button
                onClick={() => setShowCancelModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cancellation Policy */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-yellow-900 mb-1">
                    Cancellation Policy: {selectedTrip.listing.cancellationPolicy?.type || "Standard"}
                  </h3>
                  <p className="text-sm text-yellow-800">
                    {selectedTrip.listing.cancellationPolicy?.description || "No cancellation policy details available."}
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for cancellation (optional)
              </label>
              <textarea
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                rows={3}
                placeholder="Let us know why you're cancelling..."
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                disabled={actionLoading}
              >
                Keep Reservation
              </button>
              <button
                onClick={handleCancelReservation}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50"
                disabled={actionLoading}
              >
                {actionLoading ? 'Cancelling...' : 'Cancel Reservation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedTrip && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Edit Reservation Dates</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-blue-800">
                You can only edit dates at least 48 hours before check-in.
              </p>
            </div>

            <div className="space-y-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Check-in Date
                </label>
                <input
                  type="date"
                  value={editDates.checkIn}
                  onChange={(e) => setEditDates({ ...editDates, checkIn: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Check-out Date
                </label>
                <input
                  type="date"
                  value={editDates.checkOut}
                  onChange={(e) => setEditDates({ ...editDates, checkOut: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleEditReservation}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
                disabled={actionLoading}
              >
                {actionLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
