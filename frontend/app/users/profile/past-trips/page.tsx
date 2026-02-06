'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { format } from 'date-fns';
import Link from 'next/link';
import { X, Star, ChevronLeft } from 'lucide-react';
import { motion } from 'framer-motion';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export default function PastTripsPage() {
  const router = useRouter();
  const { isAuthenticated, hasHydrated, token } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [pastTrips, setPastTrips] = useState<any[]>([]);
  const [filteredTrips, setFilteredTrips] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState<'all' | 'ongoing' | 'completed' | 'canceled'>('all');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  
  // Review form state
  const [reviewData, setReviewData] = useState({
    comment: '',
    rating: 5,
    cleanliness: 5,
    accuracy: 5,
    communication: 5,
    location: 5,
    checkIn: 5,
    value: 5,
  });

  useEffect(() => {
    if (!hasHydrated) return;

    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }

    const fetchPastTrips = async () => {
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
        
        // Filter past trips (check-in date passed) and canceled/refunded reservations
        const now = new Date();
        now.setHours(0, 0, 0, 0); // Reset to start of day for accurate comparison
        const filtered = (Array.isArray(data) ? data : []).filter((trip) => {
          // Include canceled, refunded, and refund-pending reservations
          if (trip.status === 'cancelled' || trip.status === 'refunded' || trip.status === 'refund-pending') {
            return true;
          }
          // Include trips where check-in date has passed (including current ongoing trips)
          if (!trip.checkInDate) return false;
          const checkInDate = new Date(trip.checkInDate);
          checkInDate.setHours(0, 0, 0, 0);
          return checkInDate < now;
        });

        setPastTrips(filtered);
      } catch (error) {
        console.error('Error fetching past trips:', error);
        setPastTrips([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPastTrips();
  }, [hasHydrated, isAuthenticated, router, token]);

  // console.log("Fetched past trips:", pastTrips);
  // console.log("Status filter:", statusFilter);

  // Filter trips based on selected status
  useEffect(() => {
    if (statusFilter === 'all') {
      setFilteredTrips(pastTrips);
    } else if (statusFilter === 'ongoing') {
      // Ongoing trips: confirmed status and check-in passed but checkout hasn't
      const now = new Date();
      setFilteredTrips(pastTrips.filter(trip => {
        if (trip.status !== 'confirmed') return false;
        const checkIn = trip.checkInDate ? new Date(trip.checkInDate) : null;
        const checkOut = trip.checkOutDate ? new Date(trip.checkOutDate) : null;
        return checkIn && checkIn < now && checkOut && checkOut > now;
      }));
    } else if (statusFilter === 'completed') {
      // Completed trips: where checkout date has passed
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      setFilteredTrips(pastTrips.filter(trip => {
        // Exclude canceled/refunded/refund-pending
        if (trip.status === 'cancelled' || trip.status === 'refunded' || trip.status === 'refund-pending') {
          return false;
        }
        // Only include if checkout date has passed
        if (!trip.checkOutDate) return false;
        const checkOutDate = new Date(trip.checkOutDate);
        checkOutDate.setHours(0, 0, 0, 0);
        return checkOutDate < now;
      }));
    } else if (statusFilter === 'canceled') {
      setFilteredTrips(pastTrips.filter(trip => 
        trip.status === 'cancelled' || 
        trip.status === 'refunded' || 
        trip.status === 'refund-pending'
      ));
    }
  }, [statusFilter, pastTrips]);

  const openReviewModal = (trip: any) => {
    setSelectedTrip(trip);
    setReviewData({
      comment: '',
      rating: 0,
      cleanliness: 0,
      accuracy: 0,
      communication: 0,
      location: 0,
      checkIn: 0,
      value: 0,
    });
    setShowReviewModal(true);
  };

  const closeReviewModal = () => {
    setShowReviewModal(false);
    setSelectedTrip(null);
  };

  const handleSubmitReview = async () => {
    if (!selectedTrip || !reviewData.comment.trim()) {
      alert('Please write a comment for your review');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/listings/${selectedTrip.listing._id}/reviews`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            comment: reviewData.comment,
            rating: reviewData.rating,
            ratings: {
              cleanliness: reviewData.cleanliness,
              accuracy: reviewData.accuracy,
              communication: reviewData.communication,
              location: reviewData.location,
              checkIn: reviewData.checkIn,
              value: reviewData.value,
            },
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to submit review');
      }

      alert('Review submitted successfully!');
      closeReviewModal();
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('Failed to submit review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const RatingInput = ({
    label,
    value,
    onChange,
  }: {
    label: string;
    value: number;
    onChange: (val: number) => void;
  }) => (
    <div className="mb-4">
      <label className="block text-sm font-semibold mb-2">{label}</label>
      <div className="flex items-center gap-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="focus:outline-none transition-transform hover:scale-110"
          >
            <Star
              className={`w-8 h-8 ${
                star <= value
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-gray-300'
              }`}
            />
          </button>
        ))}
        <span className="ml-2 text-sm font-medium">{value}.0</span>
      </div>
    </div>
  );

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
        <h1 className="text-2xl font-bold mt-4">Past & Ongoing Trips</h1>
        <p className="text-sm text-neutral-500 mt-1">Trips after check-in date has passed</p>
        
        {/* Filter Buttons */}
        <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition ${
              statusFilter === 'all'
                ? 'bg-neutral-900 text-white'
                : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setStatusFilter('ongoing')}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition ${
              statusFilter === 'ongoing'
                ? 'bg-blue-500 text-white'
                : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
            }`}
          >
            Ongoing
          </button>
          <button
            onClick={() => setStatusFilter('completed')}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition ${
              statusFilter === 'completed'
                ? 'bg-green-500 text-white'
                : 'bg-green-50 text-green-700 hover:bg-green-100'
            }`}
          >
            Completed
          </button>
          <button
            onClick={() => setStatusFilter('canceled')}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition ${
              statusFilter === 'canceled'
                ? 'bg-red-500 text-white'
                : 'bg-red-50 text-red-700 hover:bg-red-100'
            }`}
          >
            Canceled
          </button>
        </div>
      </div>
      
      {pastTrips.length === 0 ? (
        <div className="px-5 mt-8 text-center">
          <div className="mx-auto w-32 h-32 rounded-2xl overflow-hidden">
            <img
              src="https://a0.muscache.com/im/pictures/8f9d8b02-05c9-4b8c-9f2c-47f4a2164eb7.jpg"
              alt="Past trips"
              className="w-full h-full object-contain"
            />
          </div>
          <p className="mt-6 text-sm text-neutral-600">
            You'll find your ongoing, completed and canceled trips here.
          </p>
          <Link
            href="/"
            className="mt-6 inline-block bg-rose-500 text-white text-sm font-semibold px-6 py-3 rounded-full"
          >
            Book a trip
          </Link>
        </div>
      ) : filteredTrips.length === 0 ? (
        <div className="px-5 mt-8 text-center">
          <p className="text-sm text-neutral-600">
            No trips found for the selected filter.
          </p>
        </div>
      ) : (
        <div className="px-5 mt-6 space-y-6">
          {filteredTrips.map((trip) => {
            const listing = trip.listing || {};
            const checkIn = trip.checkInDate ? new Date(trip.checkInDate) : null;
            const checkOut = trip.checkOutDate ? new Date(trip.checkOutDate) : null;
            const totalGuests = (trip.adults || 0) + (trip.children || 0);

            return (
              <div
                key={trip._id}
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

                  {/* Trip Details */}
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
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        trip.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                        trip.status === 'refund-pending' ? 'bg-orange-100 text-orange-700' :
                        trip.status === 'refunded' ? 'bg-purple-100 text-purple-700' :
                        trip.status === 'confirmed' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {trip.status === 'cancelled' ? 'Cancelled' :
                         trip.status === 'refund-pending' ? 'Refund Pending' :
                         trip.status === 'refunded' ? 'Refunded' :
                         trip.status === 'confirmed' ? 'In Progress' :
                         'Completed'}
                      </span>
                    </div>

                    {/* Dates */}
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
                        {trip.infants > 0 &&
                          `, ${trip.infants} ${
                            trip.infants === 1 ? 'infant' : 'infants'
                          }`}
                        {trip.pets > 0 &&
                          `, ${trip.pets} ${trip.pets === 1 ? 'pet' : 'pets'}`}
                      </p>
                    </div>

                    {/* Price */}
                    <div className="pt-4 border-t border-neutral-200">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-neutral-600">
                          {trip.status === 'cancelled' || trip.status === 'refunded' || trip.status === 'refund-pending' 
                            ? 'Refund amount' 
                            : 'Total amount paid'}
                        </span>
                        <span className="text-2xl font-bold text-neutral-900">
                          ₹{Number(
                            (trip.status === 'cancelled' || trip.status === 'refunded' || trip.status === 'refund-pending')
                              ? (trip.refundAmount || 0)
                              : (trip.totalAmount || 0)
                          ).toLocaleString()}
                        </span>
                      </div>
                      {(trip.status === 'cancelled' || trip.status === 'refunded' || trip.status === 'refund-pending') && trip.refundPercentage !== undefined && (
                        <p className="text-xs text-neutral-500 mt-2">
                          Refund: {trip.refundPercentage}% of ₹{Number(trip.totalAmount || 0).toLocaleString()}
                        </p>
                      )}
                    </div>

                    {/* Action Button - Write Review (only for completed trips or trips where checkout has passed) */}
                    {(trip.status === 'completed' || (trip.checkOutDate && new Date(trip.checkOutDate) < new Date())) && (
                      <div className="mt-4">
                        <button
                          onClick={() => openReviewModal(trip)}
                          className="px-6 py-2 border border-neutral-300 rounded-lg hover:bg-gray-50 transition text-sm font-semibold"
                        >
                          Write a review
                        </button>
                      </div>
                    )}
                    
                    {/* Cancellation Reason */}
                    {trip.cancellationReason && (
                      <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-200">
                        <p className="text-xs text-red-500 font-semibold uppercase mb-1">Cancellation Reason</p>
                        <p className="text-sm text-red-700">{trip.cancellationReason}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Review Modal */}
      {showReviewModal && selectedTrip && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold">Write a review</h2>
              <button
                onClick={closeReviewModal}
                className="p-2 hover:bg-gray-100 rounded-full transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="mb-6">
                <h3 className="font-semibold text-lg mb-1">
                  {selectedTrip.listing?.title || 'Listing'}
                </h3>
                <p className="text-sm text-gray-600">
                  {selectedTrip.listing?.location}
                  {selectedTrip.listing?.country
                    ? `, ${selectedTrip.listing.country}`
                    : ''}
                </p>
              </div>

              {/* Overall Rating */}
              <RatingInput
                label="Overall Rating"
                value={reviewData.rating}
                onChange={(val) => setReviewData({ ...reviewData, rating: val })}
              />

              {/* Category Ratings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
                <RatingInput
                  label="Cleanliness"
                  value={reviewData.cleanliness}
                  onChange={(val) =>
                    setReviewData({ ...reviewData, cleanliness: val })
                  }
                />
                <RatingInput
                  label="Accuracy"
                  value={reviewData.accuracy}
                  onChange={(val) =>
                    setReviewData({ ...reviewData, accuracy: val })
                  }
                />
                <RatingInput
                  label="Communication"
                  value={reviewData.communication}
                  onChange={(val) =>
                    setReviewData({ ...reviewData, communication: val })
                  }
                />
                <RatingInput
                  label="Location"
                  value={reviewData.location}
                  onChange={(val) =>
                    setReviewData({ ...reviewData, location: val })
                  }
                />
                <RatingInput
                  label="Check-in"
                  value={reviewData.checkIn}
                  onChange={(val) =>
                    setReviewData({ ...reviewData, checkIn: val })
                  }
                />
                <RatingInput
                  label="Value"
                  value={reviewData.value}
                  onChange={(val) => setReviewData({ ...reviewData, value: val })}
                />
              </div>

              {/* Review Comment */}
              <div className="mt-6">
                <label className="block text-sm font-semibold mb-2">
                  Your review
                </label>
                <textarea
                  value={reviewData.comment}
                  onChange={(e) =>
                    setReviewData({ ...reviewData, comment: e.target.value })
                  }
                  placeholder="Share your experience with future guests..."
                  className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 resize-none"
                  rows={6}
                />
              </div>

              {/* Submit Button */}
              <div className="mt-6 flex gap-3">
                <button
                  onClick={closeReviewModal}
                  className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitReview}
                  disabled={submitting || !reviewData.comment.trim()}
                  className="flex-1 px-6 py-3 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Submitting...' : 'Submit review'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
