'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { listingsAPI } from '@/lib/listings';
import { initiateRazorpayPayment } from '@/lib/razorpay';
import { format } from 'date-fns';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export default function ReservePage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated, token } = useAuthStore();

  const listingId = params.id as string;
  const checkInDate = searchParams.get('checkIn');
  const checkOutDate = searchParams.get('checkOut');
  const adultsStr = searchParams.get('adults');
  const childrenStr = searchParams.get('children');
  const infantsStr = searchParams.get('infants');
  const petsStr = searchParams.get('pets');

  const [listing, setListing] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [guestMessage, setGuestMessage] = useState('');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  const adults = parseInt(adultsStr || '0');
  const children = parseInt(childrenStr || '0');
  const infants = parseInt(infantsStr || '0');
  const pets = parseInt(petsStr || '0');
  const totalGuests = adults + children;

  // Fetch listing details
  useEffect(() => {
    if (!listingId) return;

    const fetchListing = async () => {
      try {
        setLoading(true);
        const data = await listingsAPI.getById(listingId);
        setListing(data);
      } catch (error) {
        console.error('Error fetching listing:', error);
        setError('Failed to load listing details');
      } finally {
        setLoading(false);
      }
    };

    fetchListing();
  }, [listingId]);

  // Calculate price
  const calculatePrice = () => {
    if (!checkInDate || !checkOutDate || !listing) return 0;

    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    const nights = Math.ceil(
      (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)
    );

    const pricePerNight = listing.pricePerNight || 0;
    const subtotal = pricePerNight * nights;
    const serviceFee = Math.round(subtotal * 0.14);
    const taxes = Math.round(subtotal * 0.05);

    return {
      nights,
      subtotal,
      serviceFee,
      taxes,
      total: subtotal + serviceFee + taxes,
    };
  };

  const price = calculatePrice();

  const handleReserve = async () => {
    if (!isAuthenticated || !token) {
      router.push('/auth/login');
      return;
    }

    if (!checkInDate || !checkOutDate) {
      setError('Please select check-in and check-out dates');
      return;
    }

    if (!guestMessage.trim()) {
      setError('Please add a message for the host');
      return;
    }

    if (typeof price === 'number' || !price.total) {
      setError('Invalid booking details');
      return;
    }

    setProcessing(true);
    setError('');

    try {
      // Create order on backend
      const orderResponse = await fetch(
        `${API_BASE_URL}/api/payments/create-order`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            listingId,
            checkInDate,
            checkOutDate,
            adults,
            children,
            infants,
            pets,
            guestMessage,
            totalAmount: price.total,
          }),
        }
      );

      if (!orderResponse.ok) {
        throw new Error('Failed to create order');
      }

      const orderData = await orderResponse.json();

      // Initiate Razorpay payment
      const paymentResult = await initiateRazorpayPayment(price.total, {
        orderId: orderData.orderId,
        listingId,
        checkInDate,
        checkOutDate,
        guests: totalGuests,
        guestMessage,
      }) as {
        success: boolean;
        paymentId: string;
        orderId: string;
        signature: string;
      };

      // Verify payment on backend
      const verifyResponse = await fetch(
        `${API_BASE_URL}/api/payments/verify-payment`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            orderId: paymentResult.orderId,
            paymentId: paymentResult.paymentId,
            signature: paymentResult.signature,
          }),
        }
      );

      if (!verifyResponse.ok) {
        throw new Error('Payment verification failed');
      }

      // Redirect to success page
      router.push('/dashboard/trips');
    } catch (err: any) {
      console.error('Reservation error:', err);
      setError(err.message || 'Failed to process reservation');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Listing not found</p>
          <Link href="/" className="text-rose-500 hover:underline">
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 sticky top-0 bg-white z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-full transition"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-semibold">Request to book</h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Side - Message & Payment */}
          <div className="space-y-8">
            {/* Message the Host */}
            <div className="border border-gray-200 rounded-2xl p-6">
              <h2 className="text-xl font-bold mb-4">Message the host</h2>
              <p className="text-gray-600 text-sm mb-4">
                Before you can continue, let {listing.hostDetails?.firstName || 'the host'} know a
                little about your trip and why their place is a good fit.
              </p>

              {/* Host Info */}
              <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-200">
                <img
                  src={
                    listing.hostDetails?.avatar?.url ||
                    'https://upload.wikimedia.org/wikipedia/commons/9/99/Sample_User_Icon.png'
                  }
                  alt="Host"
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div>
                  <h3 className="font-semibold">
                    {listing.hostDetails?.firstName} {listing.hostDetails?.lastName}
                  </h3>
                  <p className="text-sm text-gray-600">
                    Hosting since{' '}
                    {listing.hostDetails?.hostProfile?.hostSince
                      ? new Date(
                          listing.hostDetails.hostProfile.hostSince
                        ).getFullYear()
                      : '2024'}
                  </p>
                </div>
              </div>

              {/* Message Textarea */}
              <textarea
                value={guestMessage}
                onChange={(e) => setGuestMessage(e.target.value)}
                placeholder={`Example: "Hi John, my partner and I are going to a friend's wedding and your place is just down the road."`}
                className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 resize-none"
                rows={5}
              />
            </div>

            {/* Proceed to Payment */}
            <div className="border border-gray-200 rounded-2xl p-6">
              <h2 className="text-xl font-bold mb-2">Proceed to payment</h2>
              <p className="text-gray-600 text-sm mb-4">
                You'll be directed to Razorpay to provide your payment details.
              </p>
              <p className="text-gray-600 text-sm mb-6">
                The host has 24 hours to accept your request. You'll pay now, but get a full
                refund if the booking isn't confirmed.
              </p>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              <button
                onClick={handleReserve}
                disabled={processing}
                className="w-full bg-black hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2"
              >
                {processing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <span>Continue to</span>
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z" />
                    </svg>
                  </>
                )}
              </button>

              <p className="text-xs text-gray-500 mt-4 text-center">
                By selecting the button, I agree to the{' '}
                <Link href="#" className="underline hover:text-gray-700">
                  booking terms
                </Link>
              </p>
            </div>
          </div>

          {/* Right Side - Booking Summary */}
          <div className="space-y-6">
            {/* Listing Card */}
            <div className="border border-gray-200 rounded-2xl p-6">
              <div className="flex gap-4 mb-6">
                <img
                  src={listing.images?.[0]?.url || 'https://via.placeholder.com/400x300'}
                  alt={listing.title}
                  className="w-32 h-24 rounded-lg object-cover"
                />
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{listing.title}</h3>
                  <div className="flex items-center gap-4 mt-2 text-sm">
                    <div className="flex items-center gap-1">
                      <span className="text-yellow-400">★</span>
                      <span className="font-semibold">
                        {listing.rating?.toFixed(2) || 'N/A'}
                      </span>
                      <span className="text-gray-500">
                        ({listing.reviewCount || 0})
                      </span>
                    </div>
                    {listing.hostDetails?.hostStats?.isSuperhost && (
                      <span className="text-gray-700">🏆 Superhost</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Cancellation Policy */}
              <div className="pb-6 border-b border-gray-200">
                <p className="text-sm text-gray-600">
                  Cancel before check-in on{' '}
                  {checkInDate
                    ? format(new Date(checkInDate), 'd MMMM')
                    : 'check-in date'}{' '}
                  for a partial refund.{' '}
                  <Link href="#" className="underline text-gray-900 font-semibold">
                    Full policy
                  </Link>
                </p>
              </div>
            </div>

            {/* Booking Details */}
            <div className="border border-gray-200 rounded-2xl p-6 space-y-4">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Dates</p>
                <p className="font-semibold">
                  {checkInDate && checkOutDate
                    ? `${format(new Date(checkInDate), 'd MMM')} - ${format(
                        new Date(checkOutDate),
                        'd MMM yyyy'
                      )}`
                    : 'Not selected'}
                </p>
                <button className="text-sm text-gray-600 hover:underline mt-1">
                  Change
                </button>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Guests</p>
                <p className="font-semibold">
                  {totalGuests} {totalGuests === 1 ? 'guest' : 'guests'}
                  {infants > 0 && `, ${infants} ${infants === 1 ? 'infant' : 'infants'}`}
                  {pets > 0 && `, ${pets} ${pets === 1 ? 'pet' : 'pets'}`}
                </p>
                <button className="text-sm text-gray-600 hover:underline mt-1">
                  Change
                </button>
              </div>
            </div>

            {/* Price Breakdown */}
            <div className="border border-gray-200 rounded-2xl p-6 space-y-3">
              <div className="flex justify-between">
                <span>
                  ₹{listing.pricePerNight?.toLocaleString()} × {typeof price === 'object' ? price.nights : 0} nights
                </span>
                <span className="font-semibold">₹{typeof price === 'object' ? price.subtotal?.toLocaleString() : 0}</span>
              </div>

              <div className="flex justify-between text-sm text-gray-600">
                <span>Service fee</span>
                <span>₹{typeof price === 'object' ? price.serviceFee?.toLocaleString() : 0}</span>
              </div>

              <div className="flex justify-between text-sm text-gray-600">
                <span>Taxes</span>
                <span>₹{typeof price === 'object' ? price.taxes?.toLocaleString() : 0}</span>
              </div>

              <div className="pt-3 border-t border-gray-200 flex justify-between font-semibold text-lg">
                <span>Total INR</span>
                <span>₹{typeof price === 'object' ? price.total?.toLocaleString() : 0}</span>
              </div>

              <Link href="#" className="text-sm text-gray-600 hover:underline block">
                Price breakdown
              </Link>
            </div>

            {/* Urgency */}
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
              <div className="flex items-center gap-2 text-red-600 font-semibold">
                <span className="text-xl">⏰</span>
                <span>Only 24 hours left to book your dates</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
