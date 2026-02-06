'use client';

import { useState } from 'react';
import { X, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { differenceInDays } from 'date-fns';
import { motion } from 'framer-motion';
import { type Reservation } from '@/lib/reservations';

interface CancellationModalProps {
  reservation: Reservation | null;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
  isLoading?: boolean;
}

const CANCELLATION_REASONS = [
  'Change of plans',
  'Found a better alternative',
  'Financial constraints',
  'Schedule conflict',
  'Health issue',
  'Family emergency',
  'Other',
];

export default function CancellationModal({
  reservation,
  onClose,
  onConfirm,
  isLoading = false,
}: CancellationModalProps) {
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [customReason, setCustomReason] = useState<string>('');
  const [showCustom, setShowCustom] = useState(false);

  if (!reservation) return null;

  const daysUntilCheckIn = differenceInDays(
    new Date(reservation.checkInDate),
    new Date()
  );

  const policy = (reservation.listing?.cancellationPolicy as {
    type?: 'flexible' | 'moderate' | 'strict' | 'non-refundable';
    refundPercentages?: Record<string, number>;
    description?: string;
  }) || {};
  const policyType = (policy.type as 'flexible' | 'moderate' | 'strict' | 'non-refundable' | undefined) || 'strict';

  // Calculate refund percentage based on policy
  const getRefundPercentage = (): number => {
    const refundMap = policy.refundPercentages || {};

    switch (policyType) {
      case 'flexible':
        if (daysUntilCheckIn >= 1) return refundMap['24hours'] || 100;
        if (daysUntilCheckIn >= 7) return refundMap['7days'] || 50;
        return refundMap['default'] || 0;
      case 'moderate':
        if (daysUntilCheckIn >= 5) return refundMap['5days'] || 100;
        if (daysUntilCheckIn >= 1) return refundMap['24hours'] || 50;
        return refundMap['default'] || 0;
      case 'strict':
        if (daysUntilCheckIn >= 14) return refundMap['14days'] || 100;
        if (daysUntilCheckIn >= 7) return refundMap['7days'] || 50;
        return refundMap['default'] || 0;
      case 'non-refundable':
        return 0;
      default:
        return 0;
    }
  };

  const refundPercentage = getRefundPercentage();
  const refundAmount = (reservation.totalAmount * refundPercentage) / 100;

  // Get policy description
  const getPolicyDescription = (): string => {
    switch (policyType) {
      case 'flexible':
        return 'Get 100% refund if cancelled at least 1 day before check-in, or 50% if within 7 days.';
      case 'moderate':
        return 'Get 100% refund if cancelled at least 5 days before check-in, or 50% if within 1 day.';
      case 'strict':
        return 'Get 100% refund if cancelled at least 14 days before check-in, or 50% if within 7 days.';
      case 'non-refundable':
        return 'This reservation is non-refundable. You will not receive any refund upon cancellation.';
      default:
        return policy.description || '';
    }
  };

  // Get warning message
  const getWarningMessage = (): { message: string; type: 'warning' | 'error' | 'info' } | null => {
    if (policyType === 'non-refundable') {
      return {
        message: 'This booking is non-refundable. You will not receive any refund upon cancellation.',
        type: 'error',
      };
    }

    if (refundPercentage === 0) {
      return {
        message: `You will receive no refund as you are cancelling within the refund deadline for ${policyType} cancellation policy.`,
        type: 'warning',
      };
    }

    if (refundPercentage < 100) {
      return {
        message: `You will receive ${refundPercentage}% refund. The remaining ${100 - refundPercentage}% will be forfeited.`,
        type: 'warning',
      };
    }

    return null;
  };

  const warning = getWarningMessage();
  const reasonToSubmit = showCustom ? customReason : selectedReason;
  const isReasonValid = reasonToSubmit.trim().length >= 10;

  const handleSubmit = async () => {
    if (!isReasonValid) return;
    try {
      await onConfirm(reasonToSubmit);
    } catch (error) {
      console.error('Error confirming cancellation:', error);
    }
  };

  return (
    <motion.div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6"
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-neutral-900">Cancel Reservation</h2>
            <p className="text-sm text-neutral-600 mt-1">
              {reservation.listing?.title}
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-2 hover:bg-neutral-100 rounded-full transition disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Reservation Summary */}
        <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-neutral-50 rounded-lg">
          <div>
            <p className="text-xs text-neutral-500 font-semibold uppercase mb-1">Check-in</p>
            <p className="text-sm font-medium text-neutral-900">
              {new Date(reservation.checkInDate).toLocaleDateString()}
            </p>
          </div>
          <div>
            <p className="text-xs text-neutral-500 font-semibold uppercase mb-1">Days until check-in</p>
            <p className="text-sm font-medium text-neutral-900">
              {daysUntilCheckIn} {daysUntilCheckIn === 1 ? 'day' : 'days'}
            </p>
          </div>
          <div>
            <p className="text-xs text-neutral-500 font-semibold uppercase mb-1">Original Amount</p>
            <p className="text-sm font-medium text-neutral-900">
              ₹{Number(reservation.totalAmount).toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-xs text-neutral-500 font-semibold uppercase mb-1">Booking Status</p>
            <span className="inline-block px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded">
              Confirmed
            </span>
          </div>
        </div>

        {/* Cancellation Policy Section */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-blue-900 mb-1 capitalize">
                {policyType} Cancellation Policy
              </h3>
              <p className="text-sm text-blue-800">{getPolicyDescription()}</p>
            </div>
          </div>
        </div>

        {/* Warning Message */}
        {warning && (
          <div
            className={`mb-6 p-4 rounded-lg border flex items-start gap-3 ${
              warning.type === 'error'
                ? 'bg-red-50 border-red-200'
                : 'bg-yellow-50 border-yellow-200'
            }`}
          >
            <AlertCircle
              className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                warning.type === 'error' ? 'text-red-600' : 'text-yellow-600'
              }`}
            />
            <p
              className={`text-sm font-medium ${
                warning.type === 'error'
                  ? 'text-red-800'
                  : 'text-yellow-800'
              }`}
            >
              {warning.message}
            </p>
          </div>
        )}

        {/* Refund Information */}
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            <h3 className="font-semibold text-emerald-900">Refund Summary</h3>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-emerald-800">Refund Rate:</span>
              <span className="text-lg font-bold text-emerald-900">{refundPercentage}%</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-emerald-200">
              <span className="text-sm font-medium text-emerald-800">Amount to Refund:</span>
              <span className="text-2xl font-bold text-emerald-900">
                ₹{Number(refundAmount).toLocaleString()}
              </span>
            </div>
          </div>
          {refundAmount > 0 && (
            <p className="text-xs text-emerald-700 mt-3 italic">
              Refund will be processed to your original payment method within 5-7 business days.
            </p>
          )}
        </div>

        {/* Cancellation Reason */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-neutral-900 mb-3">
            Reason for Cancellation
          </label>

          {!showCustom && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
              {CANCELLATION_REASONS.map((reason) => (
                <button
                  key={reason}
                  onClick={() => {
                    if (reason === 'Other') {
                      setShowCustom(true);
                    } else {
                      setSelectedReason(reason);
                      setShowCustom(false);
                    }
                  }}
                  className={`p-3 text-sm text-left rounded-lg transition border-2 ${
                    selectedReason === reason && !showCustom
                      ? 'border-rose-500 bg-rose-50 text-rose-900 font-medium'
                      : 'border-neutral-200 hover:border-neutral-300 text-neutral-700'
                  }`}
                >
                  {reason}
                </button>
              ))}
            </div>
          )}

          {(showCustom || selectedReason === 'Other') && (
            <textarea
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              placeholder="Please provide a detailed reason for your cancellation (minimum 10 characters)..."
              className="w-full px-4 py-3 border-2 border-neutral-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none transition"
              rows={4}
            />
          )}

          {selectedReason && selectedReason !== 'Other' && !showCustom && (
            <p className="text-xs text-neutral-600 mt-2">
              Selected: <span className="font-medium">{selectedReason}</span>
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-6 py-3 border-2 border-neutral-200 text-neutral-700 font-semibold rounded-lg hover:bg-neutral-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Keep Reservation
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading || !isReasonValid}
            className="flex-1 px-6 py-3 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Cancelling...
              </span>
            ) : (
              'Confirm Cancellation'
            )}
          </button>
        </div>

        {/* Additional Info */}
        <p className="text-xs text-neutral-600 text-center mt-4">
          By cancelling, you agree to our terms and conditions regarding refunds and cancellation policies.
        </p>
      </motion.div>
    </motion.div>
  );
}
