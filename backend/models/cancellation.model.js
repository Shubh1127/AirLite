const mongoose = require('mongoose');

const cancellationSchema = new mongoose.Schema(
  {
    reservation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Reservation',
      required: true,
      unique: true,
    },
    reason: {
      type: String,
      required: true,
      minlength: 10,
      maxlength: 500,
    },
    cancellationPolicy: {
      type: {
        type: String,
        enum: ['flexible', 'moderate', 'strict', 'non-refundable'],
      },
      description: String,
    },
    refundAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    refundPercentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    originalAmount: {
      type: Number,
      required: true,
    },
    daysUntilCheckIn: {
      type: Number,
      required: true,
    },
    refundStatus: {
      type: String,
      enum: ['none', 'pending', 'processing', 'initiated', 'completed', 'failed'],
      default: 'pending',
    },
    refundTransactionId: {
      type: String,
      default: null,
    },
    razorpayRefundId: {
      type: String,
      default: null,
    },
    cancelledAt: {
      type: Date,
      default: Date.now,
    },
    refundInitiatedAt: {
      type: Date,
      default: null,
    },
    refundCompletedAt: {
      type: Date,
      default: null,
    },
    notes: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Cancellation', cancellationSchema);
