'use client';

import { X, Calendar, Clock, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { format, differenceInDays, isBefore } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import CancellationInfoCard from './CancellationInfoCard';
import type { Reservation, Cancellation } from '@/lib/reservations';

interface ReservationDetailsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  reservation: Reservation | null;
  cancellationInfo?: Cancellation;
  onCancel: (reservation: Reservation) => void;
  onCheckRefundStatus: (reservationId: string) => void;
}

export default function ReservationDetailsPanel({
  isOpen,
  onClose,
  reservation,
  cancellationInfo,
  onCancel,
  onCheckRefundStatus,
}: ReservationDetailsPanelProps) {
  if (!reservation) return null;

  const listing = reservation.listing || {};
  const checkIn = reservation.checkInDate ? new Date(reservation.checkInDate) : null;
  const checkOut = reservation.checkOutDate ? new Date(reservation.checkOutDate) : null;
  const totalGuests = (reservation.adults || 0) + (reservation.children || 0);

  const canCancelReservation = (res: Reservation): boolean => {
    return res.status === 'confirmed' && isBefore(new Date(), new Date(res.checkInDate));
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

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-40"
          />

          {/* Sliding Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed top-0 right-0 h-full w-full md:w-[600px] lg:w-[700px] bg-white shadow-2xl z-50 overflow-y-auto"
          >
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-neutral-200 px-6 py-4 flex items-center justify-between z-10">
              <h2 className="text-xl font-semibold">Reservation Details</h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-neutral-100 rounded-full transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Status Badge */}
              <div className="flex justify-between items-start">
                <span className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(reservation.status)}`}>
                  {reservation.status.toUpperCase()}
                </span>
                {reservation.createdAt && (
                  <p className="text-xs text-neutral-500">
                    Booked on {format(new Date(reservation.createdAt), 'd MMM yyyy, h:mm a')}
                  </p>
                )}
              </div>

              {/* Listing Image */}
              <div className="w-full h-64 rounded-xl overflow-hidden bg-neutral-100">
                <img
                  src={listing.images?.[0]?.url || 'https://via.placeholder.com/600x400'}
                  alt={listing.title || 'Listing'}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Listing Info */}
              <div>
                <h3 className="text-2xl font-bold text-neutral-900 mb-2">
                  {listing.title || 'Listing'}
                </h3>
                <p className="text-base text-neutral-600">
                  {listing.location}
                  {listing.country ? `, ${listing.country}` : ''}
                </p>
              </div>

              {/* Dates Section */}
              <div className="bg-neutral-50 rounded-xl p-5 space-y-4">
                <h4 className="font-semibold text-neutral-900">Booking Dates</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="w-4 h-4 text-neutral-500" />
                      <p className="text-xs text-neutral-500 font-semibold uppercase">Check-in</p>
                    </div>
                    <p className="text-sm font-medium">
                      {checkIn ? format(checkIn, 'EEEE, d MMMM yyyy') : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="w-4 h-4 text-neutral-500" />
                      <p className="text-xs text-neutral-500 font-semibold uppercase">Check-out</p>
                    </div>
                    <p className="text-sm font-medium">
                      {checkOut ? format(checkOut, 'EEEE, d MMMM yyyy') : 'N/A'}
                    </p>
                  </div>
                </div>
                {checkIn && checkOut && (
                  <p className="text-sm text-neutral-600">
                    {differenceInDays(checkOut, checkIn)} night{differenceInDays(checkOut, checkIn) !== 1 ? 's' : ''}
                  </p>
                )}
              </div>

              {/* Guests Info */}
              <div className="bg-neutral-50 rounded-xl p-5">
                <h4 className="font-semibold text-neutral-900 mb-3">Guest Information</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-neutral-600">Adults</span>
                    <span className="text-sm font-medium">{reservation.adults || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-neutral-600">Children</span>
                    <span className="text-sm font-medium">{reservation.children || 0}</span>
                  </div>
                  {reservation.infants > 0 && (
                    <div className="flex justify-between">
                      <span className="text-sm text-neutral-600">Infants</span>
                      <span className="text-sm font-medium">{reservation.infants}</span>
                    </div>
                  )}
                  {reservation.pets > 0 && (
                    <div className="flex justify-between">
                      <span className="text-sm text-neutral-600">Pets</span>
                      <span className="text-sm font-medium">{reservation.pets}</span>
                    </div>
                  )}
                  <div className="pt-2 border-t border-neutral-200">
                    <div className="flex justify-between">
                      <span className="text-sm font-semibold text-neutral-900">Total Guests</span>
                      <span className="text-sm font-semibold">{totalGuests}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Cancellation Info */}
              {(reservation.status === 'cancelled' || reservation.status === 'refund-pending' || reservation.status === 'refunded') && cancellationInfo ? (
                <CancellationInfoCard
                  cancellation={cancellationInfo}
                  reservationStatus={reservation.status}
                />
              ) : (reservation.status === 'cancelled' || reservation.status === 'refund-pending' || reservation.status === 'refunded') && (
                <div className="bg-blue-50 rounded-xl p-5 border border-blue-200">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-blue-900">Refund Information</h4>
                    <div className="flex items-center gap-2 text-blue-700">
                      {getRefundStatusIcon(reservation.refundStatus || 'pending')}
                      <span className="text-sm font-medium capitalize">{reservation.refundStatus || 'pending'}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-blue-700">Refund Percentage</span>
                      <span className="text-sm font-semibold text-blue-900">{reservation.refundPercentage || 0}%</span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-blue-200">
                      <span className="text-base font-semibold text-blue-900">Refund Amount</span>
                      <span className="text-2xl font-bold text-blue-900">
                        ₹{Number(reservation.refundAmount || 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  {reservation.refundStatus === 'pending' && (
                    <button
                      onClick={() => onCheckRefundStatus(reservation._id)}
                      className="mt-3 text-sm text-blue-600 hover:underline font-medium"
                    >
                      Check latest refund status
                    </button>
                  )}
                </div>
              )}

              {/* Cancellation Reason */}
              {reservation.cancellationReason && (
                <div className="bg-red-50 rounded-xl p-5 border border-red-200">
                  <h4 className="font-semibold text-red-900 mb-2">Cancellation Reason</h4>
                  <p className="text-sm text-red-700">{reservation.cancellationReason}</p>
                </div>
              )}

              {/* Price Breakdown */}
              <div className="bg-neutral-50 rounded-xl p-5">
                <h4 className="font-semibold text-neutral-900 mb-4">Price Details</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center pt-3 border-t border-neutral-200">
                    <span className="text-base font-semibold text-neutral-900">Total Amount</span>
                    <span className="text-3xl font-bold text-neutral-900">
                      ₹{Number(reservation.totalAmount || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              {canCancelReservation(reservation) && (
                <div className="sticky bottom-0 bg-white pt-4 pb-2 border-t border-neutral-200">
                  <button
                    onClick={() => onCancel(reservation)}
                    className="w-full px-6 py-4 bg-red-500 text-white rounded-xl hover:bg-red-600 transition font-semibold"
                  >
                    Cancel Reservation
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
