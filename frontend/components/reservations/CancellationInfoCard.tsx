'use client';

import { format } from 'date-fns';
import { Clock, CheckCircle, AlertCircle, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

interface CancellationInfo {
  _id: string;
  reason: string;
  refundStatus: string;
  refundAmount: number;
  refundPercentage: number;
  originalAmount: number;
  daysUntilCheckIn: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  cancelledAt: string;
  refundInitiatedAt?: string;
  refundCompletedAt?: string;
  cancellationPolicy?: {
    type: string;
    description: string;
  };
}

interface CancellationInfoCardProps {
  cancellation: CancellationInfo;
  reservationStatus: string;
}

export default function CancellationInfoCard({
  cancellation,
  reservationStatus,
}: CancellationInfoCardProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'processing':
        return <Clock className="w-5 h-5 text-blue-600 animate-spin" />;
      case 'pending':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      case 'failed':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Zap className="w-5 h-5 text-neutral-600" />;
    }
  };

  const getStatusColors = (status: string) => {
    switch (status) {
      case 'completed':
        return {
          bg: 'bg-green-50',
          border: 'border-green-200',
          text: 'text-green-900',
          label: 'text-green-700',
        };
      case 'processing':
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          text: 'text-blue-900',
          label: 'text-blue-700',
        };
      case 'pending':
        return {
          bg: 'bg-yellow-50',
          border: 'border-yellow-200',
          text: 'text-yellow-900',
          label: 'text-yellow-700',
        };
      case 'failed':
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          text: 'text-red-900',
          label: 'text-red-700',
        };
      default:
        return {
          bg: 'bg-neutral-50',
          border: 'border-neutral-200',
          text: 'text-neutral-900',
          label: 'text-neutral-700',
        };
    }
  };

  const colors = getStatusColors(cancellation.status);

  return (
    <motion.div
      className={`${colors.bg} border-2 ${colors.border} rounded-lg p-4 space-y-3`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <div className="flex-shrink-0">{getStatusIcon(cancellation.status)}</div>
          <div>
            <p className={`text-sm font-bold ${colors.text}`}>
              Cancellation in {cancellation.status}
            </p>
            <p className={`text-xs ${colors.label}`}>
              Cancelled on {format(new Date(cancellation.cancelledAt), 'MMM d, yyyy')}
            </p>
          </div>
        </div>
      </div>

      {/* Refund Information */}
      <div className={`bg-white/50 rounded p-3 border ${colors.border}`}>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className={`text-xs font-semibold ${colors.label} uppercase`}>Refund Amount</span>
            <span className={`text-lg font-bold ${colors.text}`}>
              ₹{Number(cancellation.refundAmount).toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className={colors.label}>Refund Rate</span>
            <span className={colors.label}>{cancellation.refundPercentage}% of ₹{Number(cancellation.originalAmount).toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Cancellation Policy */}
      {cancellation.cancellationPolicy && (
        <div className="text-sm">
          <p className={`font-semibold ${colors.text} capitalize mb-1`}>
            {cancellation.cancellationPolicy.type} Policy
          </p>
          <p className={`text-xs ${colors.label}`}>
            {cancellation.cancellationPolicy.description}
          </p>
        </div>
      )}

      {/* Cancellation Reason */}
      {cancellation.reason && (
        <div className="border-t pt-3">
          <p className={`text-xs font-semibold ${colors.label} uppercase mb-1`}>
            Reason for Cancellation
          </p>
          <p className={`text-sm ${colors.text}`}>
            {cancellation.reason}
          </p>
        </div>
      )}

      {/* Timeline */}
      <div className="border-t pt-3 space-y-2">
        <p className={`text-xs font-semibold ${colors.label} uppercase`}>Timeline</p>
        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-current opacity-60"></div>
            <span className={colors.label}>
              Cancelled: {format(new Date(cancellation.cancelledAt), 'MMM d, h:mm a')}
            </span>
          </div>
          {cancellation.refundInitiatedAt && (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-current opacity-60"></div>
              <span className={colors.label}>
                Refund Initiated: {format(new Date(cancellation.refundInitiatedAt), 'MMM d, h:mm a')}
              </span>
            </div>
          )}
          {cancellation.refundCompletedAt && (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-current opacity-60"></div>
              <span className={colors.label}>
                Refund Completed: {format(new Date(cancellation.refundCompletedAt), 'MMM d, h:mm a')}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Status Message */}
      {cancellation.status === 'completed' && (
        <div className="bg-white rounded p-2 text-center">
          <p className="text-xs text-green-700 font-medium">
            ✓ Refund has been successfully processed
          </p>
        </div>
      )}

      {cancellation.status === 'processing' && (
        <div className="bg-white rounded p-2 text-center">
          <p className="text-xs text-blue-700 font-medium">
            Your refund is being processed. It should reach your account within 5-7 business days.
          </p>
        </div>
      )}

      {cancellation.status === 'pending' && (
        <div className="bg-white rounded p-2 text-center">
          <p className="text-xs text-yellow-700 font-medium">
            Your cancellation is pending. Refund status will be updated shortly.
          </p>
        </div>
      )}

      {cancellation.status === 'failed' && (
        <div className="bg-white rounded p-2 text-center">
          <p className="text-xs text-red-700 font-medium">
            Refund failed. Please contact support.
          </p>
        </div>
      )}
    </motion.div>
  );
}
