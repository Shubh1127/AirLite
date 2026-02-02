const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const reservationSchema = new Schema(
  {
    listing: {
      type: Schema.Types.ObjectId,
      ref: 'Listing',
      required: true,
    },

    guest: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    checkInDate: {
      type: Date,
      required: true,
    },

    checkOutDate: {
      type: Date,
      required: true,
    },

    adults: {
      type: Number,
      default: 1,
    },

    children: {
      type: Number,
      default: 0,
    },

    infants: {
      type: Number,
      default: 0,
    },

    pets: {
      type: Number,
      default: 0,
    },

    guestMessage: {
      type: String,
    },

    totalAmount: {
      type: Number,
      required: true,
    },

    status: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled', 'completed', 'refund-pending', 'refunded'],
      default: 'pending',
    },

    cancellationReason: {
      type: String,
    },

    refundAmount: {
      type: Number,
      default: 0,
    },

    refundPercentage: {
      type: Number,
      default: 0,
    },

    refundStatus: {
      type: String,
      enum: ['none', 'pending', 'initiated', 'completed', 'failed'],
      default: 'none',
    },

    refundTransactionId: {
      type: String,
    },

    refundedAt: {
      type: Date,
    },

    canEdit: {
      type: Boolean,
      default: true,
    },

    editHistory: [{
      editedAt: Date,
      previousCheckIn: Date,
      previousCheckOut: Date,
      newCheckIn: Date,
      newCheckOut: Date,
      editedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
      }
    }],

    razorpayOrderId: {
      type: String,
    },

    razorpayPaymentId: {
      type: String,
    },

    razorpaySignature: {
      type: String,
    },

    confirmedAt: {
      type: Date,
    },

    cancelledAt: {
      type: Date,
    },

    completedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Reservation', reservationSchema);
