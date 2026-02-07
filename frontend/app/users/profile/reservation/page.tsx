'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { format, differenceInDays, addDays, isBefore } from 'date-fns';
import Link from 'next/link';
import { X, Calendar, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import CancellationModal from '@/components/reservations/CancellationModal';
import ReservationDetailsPanel from '@/components/reservations/ReservationDetailsPanel';
import { getMyReservations, cancelReservation, editReservation, checkRefundStatus, getCancellationInfo, type Reservation, type Cancellation } from '@/lib/reservations';

export default function ReservationsPage() {
  const router = useRouter();
  const { isAuthenticated, hasHydrated, token } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [cancellationInfoMap, setCancellationInfoMap] = useState<Record<string, Cancellation>>({});
  const [cancellationLoading, setCancellationLoading] = useState<Record<string, boolean>>({});
  const [cancelModal, setCancelModal] = useState<{ open: boolean; reservation: Reservation | null }>({
    open: false,
    reservation: null,
  });
  const [editModal, setEditModal] = useState<{ open: boolean; reservation: Reservation | null }>({
    open: false,
    reservation: null,
  });
  const [detailsPanel, setDetailsPanel] = useState<{ open: boolean; reservation: Reservation | null }>({
    open: false,
    reservation: null,
  });
  const [cancelling, setCancelling] = useState(false);
  const [editing, setEditing] = useState(false);
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
      // Filter out canceled/refunded reservations and those where check-in has passed
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      const activeReservations = data.filter((reservation: Reservation) => {
        // Exclude canceled/refunded reservations
        if (reservation.status === 'cancelled' || 
            reservation.status === 'refunded' || 
            reservation.status === 'refund-pending') {
          return false;
        }
        // Exclude reservations where check-in date has passed
        if (reservation.checkInDate) {
          const checkInDate = new Date(reservation.checkInDate);
          checkInDate.setHours(0, 0, 0, 0);
          if (checkInDate < now) {
            return false;
          }
        }
        return true;
      });
      setReservations(activeReservations);

      // Fetch cancellation info for cancelled reservations
      const cancellationMap: Record<string, Cancellation> = {};
      for (const reservation of data) {
        if (
          reservation.status === 'cancelled' ||
          reservation.status === 'refund-pending' ||
          reservation.status === 'refunded'
        ) {
          try {
            const cancellationInfo = await getCancellationInfo(reservation._id);
            cancellationMap[reservation._id] = cancellationInfo;
          } catch (error) {
            console.error(`Failed to fetch cancellation info for ${reservation._id}:`, error);
          }
        }
      }
      setCancellationInfoMap(cancellationMap);
    } catch (error) {
      console.error('Error fetching reservations:', error);
      setReservations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelClick = (reservation: Reservation) => {
    setCancelModal({ open: true, reservation });
  };

  const handleEditClick = (reservation: Reservation) => {
    setEditModal({ open: true, reservation });
    setNewCheckIn(reservation.checkInDate.split('T')[0]);
    setNewCheckOut(reservation.checkOutDate.split('T')[0]);
  };

  const handleConfirmCancel = async (reason: string) => {
    if (!cancelModal.reservation || !reason.trim()) {
      alert('Please provide a cancellation reason');
      return;
    }

    try {
      setCancelling(true);
      await cancelReservation(cancelModal.reservation._id, reason);
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
    <motion.div
      className="min-h-screen bg-white pb-24"
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 26, stiffness: 260 }}
    >
      <div className="px-5 pt-6">
        <button
          type="button"
          onClick={() => router.back()}
          className="w-10 h-10 rounded-full border border-neutral-200 flex items-center justify-center"
        >
          <ChevronLeft className="w-5 h-5 text-neutral-700" />
        </button>
        <h1 className="text-2xl font-bold mt-4">Upcoming Reservations</h1>
        <p className="text-sm text-neutral-500 mt-1">Reservations before check-in date</p>
      </div>
      
      {reservations.length === 0 ? (
        <div className="px-5 mt-8 text-center">
          <div className="mx-auto w-32 h-32 rounded-2xl overflow-hidden">
            <img
              src="https://a0.muscache.com/im/pictures/airbnb-platform-assets/AirbnbPlatformAssets-trips-tab/original/c2f5127b-f701-4e2d-bbf0-d54afe17d6e3.png?im_w=1680&im_q=medqg"
              alt="Reservations"
              className="w-full h-full object-contain"
            />
          </div>
          <p className="mt-6 text-sm text-neutral-600">
            You have no upcoming reservations. Once check-in date passes, reservations will move to Trips section.
          </p>
          <Link
            href="/"
            className="mt-6 inline-block bg-rose-500 text-white text-sm font-semibold px-6 py-3 rounded-full"
          >
            Book a trip
          </Link>
        </div>
      ) : (
        <div className="px-5 mt-6 space-y-4">
          {reservations.map((reservation) => {
            const listing = reservation.listing || {};
            const checkIn = reservation.checkInDate ? new Date(reservation.checkInDate) : null;
            const checkOut = reservation.checkOutDate ? new Date(reservation.checkOutDate) : null;
            const totalGuests = (reservation.adults || 0) + (reservation.children || 0);

            return (
              <div
                key={reservation._id}
                onClick={() => setDetailsPanel({ open: true, reservation })}
                className="bg-white border border-neutral-200 rounded-2xl p-4 hover:shadow-lg transition-all cursor-pointer hover:border-neutral-300"
              >
                <div className="flex gap-4">
                  {/* Listing Image */}
                  <div className="w-24 h-24 md:w-32 md:h-32 rounded-xl overflow-hidden bg-neutral-100 flex-shrink-0">
                    <img
                      src={listing.images?.[0]?.url || 'https://via.placeholder.com/400x300'}
                      alt={listing.title || 'Listing'}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Reservation Summary */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base md:text-lg font-semibold text-neutral-900 truncate">
                          {listing.title || 'Listing'}
                        </h3>
                        <p className="text-xs md:text-sm text-neutral-600 truncate">
                          {listing.location}
                          {listing.country ? `, ${listing.country}` : ''}
                        </p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-neutral-400 flex-shrink-0 ml-2" />
                    </div>

                    <div className="space-y-1 mb-2">
                      <p className="text-xs text-neutral-600">
                        {checkIn ? format(checkIn, 'd MMM') : 'N/A'} - {checkOut ? format(checkOut, 'd MMM yyyy') : 'N/A'}
                      </p>
                      <p className="text-xs text-neutral-600">
                        {totalGuests} {totalGuests === 1 ? 'guest' : 'guests'}
                      </p>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(reservation.status)}`}>
                        {reservation.status}
                      </span>
                      <span className="text-sm md:text-base font-bold text-neutral-900">
                        ₹{Number(reservation.totalAmount || 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reservation Details Panel */}
      <ReservationDetailsPanel
        isOpen={detailsPanel.open}
        onClose={() => setDetailsPanel({ open: false, reservation: null })}
        reservation={detailsPanel.reservation}
        cancellationInfo={detailsPanel.reservation ? cancellationInfoMap[detailsPanel.reservation._id] : undefined}
        onCancel={(reservation) => {
          setDetailsPanel({ open: false, reservation: null });
          handleCancelClick(reservation);
        }}
        onCheckRefundStatus={handleCheckRefundStatus}
      />

      {/* Cancel Modal - Using New Component */}
      {cancelModal.open && cancelModal.reservation && (
        <CancellationModal
          reservation={cancelModal.reservation}
          onClose={() => setCancelModal({ open: false, reservation: null })}
          onConfirm={handleConfirmCancel}
          isLoading={cancelling}
        />
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
    </motion.div>
  );
}
