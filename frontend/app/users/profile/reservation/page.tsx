'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { format, differenceInDays, addDays, isBefore } from 'date-fns';
import Link from 'next/link';
import { X, Calendar, AlertCircle, CheckCircle, Clock, XCircle, RefreshCw } from 'lucide-react';
import { getMyReservations, cancelReservation, editReservation, checkRefundStatus, type Reservation } from '@/lib/reservations';

export default function ReservationsPage() {
  const router = useRouter();
  const { isAuthenticated, hasHydrated, token } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [cancelModal, setCancelModal] = useState<{ open: boolean; reservation: Reservation | null }>({
    open: false,
    reservation: null,
  });
  const [editModal, setEditModal] = useState<{ open: boolean; reservation: Reservation | null }>({
    open: false,
    reservation: null,
  });
  const [cancelling, setCancelling] = useState(false);
  const [editing, setEditing] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [newCheckIn, setNewCheckIn] = useState('');
  const [newCheckOut, setNewCheckOut] = useState('');

  useEffect(() => {
    if (!hasHydrated) return;

    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }

    fetchReservations();
  }, [hasHydrated, isAuthenticated, router]);

  const fetchReservations = async () => {
    try {
      setLoading(true);
      const data = await getMyReservations();
      setReservations(data);
    } catch (error) {
      console.error('Error fetching reservations:', error);
      setReservations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelClick = (reservation: Reservation) => {
    setCancelModal({ open: true, reservation });
    setCancelReason('');
  };

  const handleEditClick = (reservation: Reservation) => {
    setEditModal({ open: true, reservation });
    setNewCheckIn(reservation.checkInDate.split('T')[0]);
    setNewCheckOut(reservation.checkOutDate.split('T')[0]);
  };

  const handleConfirmCancel = async () => {
    if (!cancelModal.reservation || !cancelReason.trim()) {
      alert('Please provide a cancellation reason');
      return;
    }

    try {
      setCancelling(true);
      await cancelReservation(cancelModal.reservation._id, cancelReason);
      await fetchReservations();
      setCancelModal({ open: false, reservation: null });
      alert('Reservation cancelled successfully');
    } catch (error: any) {
      alert(error.message || 'Failed to cancel reservation');
    } finally {
      setCancelling(false);
    }
  };

  const handleConfirmEdit = async () => {
    if (!editModal.reservation || !newCheckIn || !newCheckOut) {
      alert('Please select valid dates');
      return;
    }

    try {
      setEditing(true);
      await editReservation(editModal.reservation._id, newCheckIn, newCheckOut);
      await fetchReservations();
      setEditModal({ open: false, reservation: null });
      alert('Reservation updated successfully');
    } catch (error: any) {
      alert(error.message || 'Failed to update reservation');
    } finally {
      setEditing(false);
    }
  };

  const handleCheckRefundStatus = async (reservationId: string) => {
    try {
      const status = await checkRefundStatus(reservationId);
      alert(`Refund Status: ${status.refundStatus}\nAmount: ₹${status.refundAmount}`);
      await fetchReservations();
    } catch (error: any) {
      alert(error.message || 'Failed to check refund status');
    }
  };

  const getRefundPercentage = (reservation: Reservation): number => {
    if (!reservation.listing?.cancellationPolicy) return 0;

    const daysUntilCheckIn = differenceInDays(
      new Date(reservation.checkInDate),
      new Date()
    );

    const policy = reservation.listing.cancellationPolicy;
    const refundMap = policy.refundPercentages || {};

    // Check each threshold in the policy
    if (policy.type === 'flexible') {
      if (daysUntilCheckIn >= 1) return refundMap['24hours'] || 100;
      if (daysUntilCheckIn >= 7) return refundMap['7days'] || 50;
      return refundMap['default'] || 0;
    } else if (policy.type === 'moderate') {
      if (daysUntilCheckIn >= 5) return refundMap['5days'] || 100;
      if (daysUntilCheckIn >= 1) return refundMap['24hours'] || 50;
      return refundMap['default'] || 0;
    } else if (policy.type === 'strict') {
      if (daysUntilCheckIn >= 14) return refundMap['14days'] || 100;
      if (daysUntilCheckIn >= 7) return refundMap['7days'] || 50;
      return refundMap['default'] || 0;
    }

    return refundMap['default'] || 0;
  };

  const canEditReservation = (reservation: Reservation): boolean => {
    if (reservation.status !== 'confirmed') return false;
    const hoursUntilCheckIn = differenceInDays(new Date(reservation.checkInDate), new Date()) * 24;
    return hoursUntilCheckIn >= 48;
  };

  const canCancelReservation = (reservation: Reservation): boolean => {
    return reservation.status === 'confirmed' && isBefore(new Date(), new Date(reservation.checkInDate));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-700';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'cancelled':
        return 'bg-red-100 text-red-700';
      case 'completed':
        return 'bg-blue-100 text-blue-700';
      case 'refund-pending':
        return 'bg-orange-100 text-orange-700';
      case 'refunded':
        return 'bg-purple-100 text-purple-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getRefundStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'processed':
        return <CheckCircle className="w-4 h-4" />;
      case 'failed':
        return <XCircle className="w-4 h-4" />;
      default:
        return <RefreshCw className="w-4 h-4" />;
    }
  };

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
      <h1 className="text-3xl font-bold mb-8">Your Trips</h1>
      
      {reservations.length === 0 ? (
        <div className="bg-white border border-neutral-200 rounded-2xl p-12 text-center">
          <p className="text-neutral-600 text-lg">No trips yet</p>
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
            const refundPercentage = getRefundPercentage(reservation);

            return (
              <div
                key={reservation._id}
                className="bg-white border border-neutral-200 rounded-2xl p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Listing Image */}
                  <div className="w-full md:w-64 h-48 rounded-xl overflow-hidden bg-neutral-100 flex-shrink-0">
                    <img
                      src={listing.images?.[0]?.url || 'https://via.placeholder.com/400x300'}
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
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(reservation.status)}`}>
                        {reservation.status}
                      </span>
                    </div>

                    {/* Dates and Guests */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-neutral-500 font-semibold uppercase mb-1">Check-in</p>
                        <p className="text-sm font-medium">
                          {checkIn ? format(checkIn, 'EEEE, d MMMM yyyy') : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-neutral-500 font-semibold uppercase mb-1">Check-out</p>
                        <p className="text-sm font-medium">
                          {checkOut ? format(checkOut, 'EEEE, d MMMM yyyy') : 'N/A'}
                        </p>
                      </div>
                    </div>

                    {/* Guests */}
                    <div className="mb-4">
                      <p className="text-xs text-neutral-500 font-semibold uppercase mb-1">Guests</p>
                      <p className="text-sm">
                        {totalGuests} {totalGuests === 1 ? 'guest' : 'guests'}
                        {reservation.infants > 0 && `, ${reservation.infants} infant${reservation.infants > 1 ? 's' : ''}`}
                        {reservation.pets > 0 && `, ${reservation.pets} pet${reservation.pets > 1 ? 's' : ''}`}
                      </p>
                    </div>

                    {/* Refund Info */}
                    {(reservation.status === 'cancelled' || reservation.status === 'refund-pending' || reservation.status === 'refunded') && (
                      <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-semibold text-blue-900">Refund Information</span>
                          <div className="flex items-center gap-1 text-blue-700">
                            {getRefundStatusIcon(reservation.refundStatus || 'pending')}
                            <span className="text-xs font-medium">{reservation.refundStatus || 'pending'}</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-blue-700">
                            Refund: {reservation.refundPercentage || 0}%
                          </span>
                          <span className="text-lg font-bold text-blue-900">
                            ₹{Number(reservation.refundAmount || 0).toLocaleString()}
                          </span>
                        </div>
                        {reservation.refundStatus === 'pending' && (
                          <button
                            onClick={() => handleCheckRefundStatus(reservation._id)}
                            className="mt-2 text-xs text-blue-600 hover:underline"
                          >
                            Check latest status
                          </button>
                        )}
                      </div>
                    )}

                    {/* Cancellation Reason */}
                    {reservation.cancellationReason && (
                      <div className="mb-4 p-3 bg-red-50 rounded-lg">
                        <p className="text-xs text-red-500 font-semibold uppercase mb-1">Cancellation Reason</p>
                        <p className="text-sm text-red-700">{reservation.cancellationReason}</p>
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

                    {/* Action Buttons */}
                    {( canCancelReservation(reservation)) && (
                      <div className="flex gap-3 mt-4">
                        {canCancelReservation(reservation) && (
                          <button
                            onClick={() => handleCancelClick(reservation)}
                            className="flex-1 cursor-pointer w-max px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                          >
                            Cancel Reservation
                          </button>
                        )}
                      </div>
                    )}

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

      {/* Cancel Modal */}
      {cancelModal.open && cancelModal.reservation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Cancel Reservation</h2>
              <button
                onClick={() => setCancelModal({ open: false, reservation: null })}
                className="p-2 hover:bg-gray-100 rounded-full transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-6">
              <p className="text-sm text-gray-600 mb-4">
                {cancelModal.reservation.listing?.cancellationPolicy?.description}
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm font-semibold text-blue-900 mb-1">Estimated Refund</p>
                <p className="text-2xl font-bold text-blue-700">
                  {getRefundPercentage(cancelModal.reservation)}% - ₹
                  {((cancelModal.reservation.totalAmount * getRefundPercentage(cancelModal.reservation)) / 100).toLocaleString()}
                </p>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Reason for cancellation</label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Please tell us why you're cancelling..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                rows={4}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setCancelModal({ open: false, reservation: null })}
                className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                disabled={cancelling}
              >
                Keep Reservation
              </button>
              <button
                onClick={handleConfirmCancel}
                disabled={cancelling || !cancelReason.trim()}
                className="flex-1 px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {cancelling ? 'Cancelling...' : 'Cancel Reservation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editModal.open && editModal.reservation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Edit Reservation</h2>
              <button
                onClick={() => setEditModal({ open: false, reservation: null })}
                className="p-2 hover:bg-gray-100 rounded-full transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-yellow-800">
                  You can only edit reservations up to 48 hours before check-in.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Check-in Date</label>
                  <input
                    type="date"
                    value={newCheckIn}
                    onChange={(e) => setNewCheckIn(e.target.value)}
                    min={format(addDays(new Date(), 3), 'yyyy-MM-dd')}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Check-out Date</label>
                  <input
                    type="date"
                    value={newCheckOut}
                    onChange={(e) => setNewCheckOut(e.target.value)}
                    min={newCheckIn || format(addDays(new Date(), 4), 'yyyy-MM-dd')}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setEditModal({ open: false, reservation: null })}
                className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                disabled={editing}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmEdit}
                disabled={editing || !newCheckIn || !newCheckOut}
                className="flex-1 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {editing ? 'Updating...' : 'Update Dates'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
