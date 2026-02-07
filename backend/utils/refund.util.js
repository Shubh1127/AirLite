const Razorpay = require('razorpay');
const Reservation = require('../models/reservation.model');
const Cancellation = require('../models/cancellation.model');
const User = require('../models/user.model');
const Listing = require('../models/listing.model');
const {
  sendRefundSuccessfulEmail,
  sendRefundFailedEmail,
} = require('./mail.util');

/**
 * Initialize Razorpay instance
 */
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/**
 * Fetch and update refund status for a single reservation
 * @param {Object} reservation - Reservation document
 * @returns {Object} - Updated reservation details
 */
const updateSingleRefundStatus = async (reservation) => {
  try {
    // Skip if no refund transaction ID
    if (!reservation.refundTransactionId) {
      console.log(`⚠️  Reservation ${reservation._id}: No refund transaction ID found`);
      return null;
    }

    const refundId = reservation.refundTransactionId;
    console.log(`\n🔍 Fetching refund status for: ${refundId}`);
    console.log(`   Current DB Status: ${reservation.status} | Refund Status: ${reservation.refundStatus}`);

    // Fetch refund details from Razorpay
    const refund = await razorpay.refunds.fetch(refundId);

    console.log(`   ✅ Got Razorpay Response`);
    console.log(`      - Razorpay Refund Status: ${refund.status}`);
    console.log(`      - Amount: ₹${refund.amount / 100}`);

    const refundStatus = refund.status; // 'processed', 'failed', 'pending', etc.

    // Map Razorpay refund status to our database status
    let newReservationStatus = reservation.status;
    let newRefundStatus = reservation.refundStatus;

    if (refundStatus === 'processed' || refundStatus === 'partial' || refundStatus === 'optimized') {
      console.log(`   ✅ Refund SUCCEEDED`);
      newReservationStatus = 'refunded';
      newRefundStatus = 'completed';
    } else if (refundStatus === 'failed') {
      console.log(`   ❌ Refund FAILED`);
      newReservationStatus = 'cancelled';
      newRefundStatus = 'failed';
    } else if (refundStatus === 'pending') {
      console.log(`   ⏳ Refund still PENDING`);
      newRefundStatus = 'initiated';
      // Keep status as 'refund-pending'
    }

    // Only update if status changed
    if (
      newReservationStatus !== reservation.status ||
      newRefundStatus !== reservation.refundStatus
    ) {
      console.log(`\n🔄 STATUS CHANGED - UPDATING DATABASE`);
      console.log(`   Reservation Status: ${reservation.status} → ${newReservationStatus}`);
      console.log(`   Refund Status: ${reservation.refundStatus} → ${newRefundStatus}`);

      // Update reservation
      const updatedReservation = await Reservation.findByIdAndUpdate(
        reservation._id,
        {
          status: newReservationStatus,
          refundStatus: newRefundStatus,
          refundedAt: newReservationStatus === 'refunded' ? new Date() : reservation.refundedAt,
        },
        { new: true }
      ).populate('guest').populate('listing');

      console.log(`   ✅ Reservation record updated in DB`);

      // Update Cancellation record
      await Cancellation.findOneAndUpdate(
        { reservation: reservation._id },
        {
          refundStatus: newRefundStatus,
          status: newReservationStatus === 'refunded' ? 'completed' : 'failed',
          refundCompletedAt: newReservationStatus === 'refunded' ? new Date() : null,
        }
      );

      console.log(`   ✅ Cancellation record updated in DB`);

      // Send email notification based on refund status
      if (updatedReservation.guest && updatedReservation.listing) {
        const guest = updatedReservation.guest;
        const listing = updatedReservation.listing;

        const userObj = {
          email: guest.email,
          name: guest.firstName || guest.email.split('@')[0],
          username: guest.firstName || guest.email.split('@')[0],
        };

        const reservationObj = {
          _id: updatedReservation._id,
          checkIn: updatedReservation.checkInDate,
          checkOut: updatedReservation.checkOutDate,
          numberOfGuests: (updatedReservation.adults || 0) + (updatedReservation.children || 0),
          numberOfNights: Math.ceil(
            (new Date(updatedReservation.checkOutDate) - new Date(updatedReservation.checkInDate)) /
              (1000 * 60 * 60 * 24)
          ),
          totalPrice: updatedReservation.totalAmount,
        };

        const listingObj = {
          _id: listing._id,
          title: listing.title,
          location: listing.location,
        };

        const refundInfo = {
          amount: updatedReservation.refundAmount,
          percentage: updatedReservation.refundPercentage,
          originalAmount: updatedReservation.totalAmount,
          transactionId: refundId,
        };

        if (newReservationStatus === 'refunded') {
          console.log(`   📧 Sending refund success email to ${guest.email}`);
          sendRefundSuccessfulEmail(userObj, reservationObj, listingObj, refundInfo).catch((err) =>
            console.error('   ❌ Email failed:', err.message)
          );
        } else if (newReservationStatus === 'cancelled' && newRefundStatus === 'failed') {
          console.log(`   📧 Sending refund failed email to ${guest.email}`);
          sendRefundFailedEmail(userObj, reservationObj, listingObj, refundInfo).catch((err) =>
            console.error('   ❌ Email failed:', err.message)
          );
        }
      }

      return updatedReservation;
    } else {
      console.log(`   ℹ️  No status change - DB already has current status`);
      return reservation;
    }
  } catch (err) {
    console.error(`❌ Error updating refund status for ${reservation._id}:`, err.message);
    return null;
  }
};

/**
 * Fetch and update all pending refund statuses from Razorpay
 * @returns {Object} - Summary of updates
 */
exports.updateAllPendingRefunds = async () => {
  try {
    console.log('\n' + '='.repeat(60));
    console.log('🔄 CHECKING PENDING REFUNDS FROM RAZORPAY');
    console.log('='.repeat(60));
    console.log('⏰ Timestamp:', new Date().toISOString());
    console.log('🔍 Querying database for pending/initiated refunds...');

    // Find all reservations with pending/initiated refunds
    const pendingRefunds = await Reservation.find({
      $or: [
        { refundStatus: 'pending' },
        { refundStatus: 'initiated' },
      ],
      refundTransactionId: { $exists: true, $ne: null },
    }).sort({ refundedAt: -1 });

    console.log(`📊 Found ${pendingRefunds.length} reservations with pending refunds`);

    if (pendingRefunds.length === 0) {
      console.log('ℹ️  No pending refunds to check\n');
      return {
        total: 0,
        updated: 0,
        unchanged: 0,
        errors: 0,
        updatedReservations: [],
      };
    }

    let updated = 0;
    let unchanged = 0;
    let errors = 0;
    const updatedReservations = [];

    // Process each pending refund
    for (const reservation of pendingRefunds) {
      const result = await updateSingleRefundStatus(reservation);

      if (result) {
        if (result.status !== reservation.status) {
          updated++;
          updatedReservations.push({
            reservationId: result._id,
            oldStatus: reservation.status,
            newStatus: result.status,
            refundAmount: result.refundAmount,
            guestEmail: result.guest?.email || 'Unknown',
          });
        } else {
          unchanged++;
        }
      } else {
        errors++;
      }

      // Add a small delay between API calls to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    console.log('\n' + '='.repeat(60));
    console.log('📈 REFUND CHECK SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Updated: ${updated}`);
    console.log(`ℹ️  Unchanged: ${unchanged}`);
    console.log(`❌ Errors: ${errors}`);
    console.log(`📊 Total Checked: ${pendingRefunds.length}`);

    if (updatedReservations.length > 0) {
      console.log('\n📋 RESERVATIONS UPDATED:');
      updatedReservations.forEach((res) => {
        console.log(`   ✅ ${res.reservationId}`);
        console.log(`      • Status: ${res.oldStatus} → ${res.newStatus}`);
        console.log(`      • Refund Amount: ₹${res.refundAmount}`);
        console.log(`      • Guest: ${res.guestEmail}`);
      });
    } else if (unchanged > 0) {
      console.log('\n✓ No changes - All refunds already have current status');
    }

    console.log('='.repeat(60) + '\n');

    return {
      total: pendingRefunds.length,
      updated,
      unchanged,
      errors,
      updatedReservations,
    };
  } catch (err) {
    console.error('❌ Error in updateAllPendingRefunds:', err.message);
    console.error('   Stack:', err.stack);
    return {
      total: 0,
      updated: 0,
      unchanged: 0,
      errors: 1,
      updatedReservations: [],
    };
  }
};

/**
 * Get pending refund statistics
 * @returns {Object} - Statistics about pending refunds
 */
exports.getPendingRefundStats = async () => {
  try {
    const stats = await Reservation.aggregate([
      {
        $match: {
          $or: [
            { refundStatus: 'pending' },
            { refundStatus: 'initiated' },
          ],
          refundTransactionId: { $exists: true, $ne: null },
        },
      },
      {
        $group: {
          _id: '$refundStatus',
          count: { $sum: 1 },
          totalAmount: { $sum: '$refundAmount' },
        },
      },
    ]);

    return {
      byStatus: stats,
      timestamp: new Date().toISOString(),
    };
  } catch (err) {
    console.error('Error getting pending refund stats:', err);
    return { error: err.message };
  }
};

/**
 * Manually check a specific reservation's refund status
 * @param {String} reservationId - ID of the reservation
 * @returns {Object} - Updated reservation details
 */
exports.checkSpecificRefund = async (reservationId) => {
  try {
    const reservation = await Reservation.findById(reservationId);

    if (!reservation) {
      return { error: 'Reservation not found' };
    }

    if (!reservation.refundTransactionId) {
      return { error: 'No refund transaction ID found for this reservation' };
    }

    console.log(`\n🔍 Manually checking refund for reservation: ${reservationId}`);
    const result = await updateSingleRefundStatus(reservation);

    return result;
  } catch (err) {
    console.error('Error checking specific refund:', err);
    return { error: err.message };
  }
};

module.exports = {
  updateAllPendingRefunds: exports.updateAllPendingRefunds,
  getPendingRefundStats: exports.getPendingRefundStats,
  checkSpecificRefund: exports.checkSpecificRefund,
  updateSingleRefundStatus,
};
