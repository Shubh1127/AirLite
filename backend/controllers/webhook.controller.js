const crypto = require('crypto');
const Reservation = require('../models/reservation.model');
const Cancellation = require('../models/cancellation.model');
const User = require('../models/user.model');
const Listing = require('../models/listing.model');
const {
  sendRefundSuccessfulEmail,
  sendRefundFailedEmail,
} = require('../utils/mail.util');

/**
 * Verify Razorpay webhook signature
 */
const verifyWebhookSignature = (secret, body, signature) => {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');
  
  return expectedSignature === signature;
};

/**
 * Handle Razorpay Webhook Events
 */
exports.handleWebhook = async (req, res) => {
  try {
    // Log webhook receipt
    console.log('=====================================');
    console.log('🔔 WEBHOOK RECEIVED FROM RAZORPAY');
    console.log('=====================================');
    console.log('Timestamp:', new Date().toISOString());
    console.log('Event Type:', req.body.event);
    console.log('Refund ID:', req.body.payload?.refund?.id);

    // Verify webhook signature
    const razorapaySignature = req.headers['x-razorpay-signature'];
    const body = JSON.stringify(req.body);

    if (!verifyWebhookSignature(process.env.RAZORPAY_WEBHOOK_SECRET, body, razorapaySignature)) {
      console.error('❌ WEBHOOK VERIFICATION FAILED: Invalid signature');
      return res.status(401).json({ message: 'Invalid signature' });
    }

    console.log('✅ WEBHOOK SIGNATURE VERIFIED');

    const event = req.body.event;
    const payload = req.body.payload;

    console.log(`\n📨 Processing webhook event: ${event}`);

    switch (event) {
      case 'refund.processed':
        console.log('➡️  Handling refund.processed event...');
        await handleRefundProcessed(payload);
        break;
      case 'refund.failed':
        console.log('➡️  Handling refund.failed event...');
        await handleRefundFailed(payload);
        break;
      case 'refund.created':
        // Optional: Log refund creation
        console.log(`📝 Refund created: ${payload.refund.id}`);
        break;
      default:
        console.log(`Unhandled event type: ${event}`);
    }

    res.status(200).json({ status: 'ok' });
  } catch (err) {
    console.error('❌ WEBHOOK ERROR:', err);
    res.status(500).json({ message: 'Webhook processing failed' });
  }
};

/**
 * Handle refund.processed event
 */
const handleRefundProcessed = async (payload) => {
  try {
    const refund = payload.refund;
    const refundId = refund.id;

    console.log(`\n💰 PROCESSING REFUND: ${refundId}`);
    console.log(`   Amount: ₹${refund.amount / 100}`);
    console.log(`   Status: ${refund.status}`);

    // Find reservation by refund transaction ID
    const reservation = await Reservation.findOne({
      refundTransactionId: refundId,
    }).populate('guest').populate('listing');

    if (!reservation) {
      console.log(`❌ Reservation not found for refund ID: ${refundId}`);
      return;
    }

    console.log(`✅ Found reservation: ${reservation._id}`);

    // Update reservation status
    reservation.refundStatus = 'completed';
    reservation.refundedAt = new Date();
    reservation.status = 'refunded';
    await reservation.save();

    console.log(`✅ Updated Reservation status to: refunded`);

    // Update cancellation record
    const cancellation = await Cancellation.findOneAndUpdate(
      { reservation: reservation._id },
      {
        refundStatus: 'completed',
        refundCompletedAt: new Date(),
        status: 'completed',
      },
      { new: true }
    );

    console.log(`✅ Updated Cancellation record status to: completed`);

    // Prepare email data
    const guest = reservation.guest;
    const listing = reservation.listing;

    const userObj = {
      email: guest.email,
      name: guest.firstName || guest.email.split('@')[0],
      username: guest.firstName || guest.email.split('@')[0],
    };

    const reservationObj = {
      _id: reservation._id,
      checkIn: reservation.checkInDate,
      checkOut: reservation.checkOutDate,
      numberOfGuests: (reservation.adults || 0) + (reservation.children || 0),
      numberOfNights: Math.ceil(
        (new Date(reservation.checkOutDate) - new Date(reservation.checkInDate)) /
          (1000 * 60 * 60 * 24)
      ),
      totalPrice: reservation.totalAmount,
    };

    const listingObj = {
      _id: listing._id,
      title: listing.title,
      location: listing.location,
    };

    const refundInfo = {
      amount: reservation.refundAmount,
      percentage: reservation.refundPercentage,
      originalAmount: reservation.totalAmount,
      transactionId: refundId,
      refundedAt: new Date(),
    };

    // Send refund successful email
    await sendRefundSuccessfulEmail(userObj, reservationObj, listingObj, refundInfo).catch(
      (err) => console.error('Failed to send refund successful email:', err)
    );

    console.log(`✅ 🎉 REFUND PROCESSED SUCCESSFULLY for reservation: ${reservation._id}`);
    console.log(`=====================================\n`);
  } catch (err) {
    console.error('❌ Error handling refund.processed:', err);
  }
};

/**
 * Handle refund.failed event
 */
const handleRefundFailed = async (payload) => {
  try {
    const refund = payload.refund;
    const refundId = refund.id;

    console.log(`\n❌ PROCESSING FAILED REFUND: ${refundId}`);
    console.log(`   Amount: ₹${refund.amount / 100}`);
    console.log(`   Reason: ${refund.reason_code || 'Unknown'}`);

    // Find reservation by refund transaction ID
    const reservation = await Reservation.findOne({
      refundTransactionId: refundId,
    }).populate('guest').populate('listing');

    if (!reservation) {
      console.log(`❌ Reservation not found for refund ID: ${refundId}`);
      return;
    }

    console.log(`✅ Found reservation: ${reservation._id}`);

    // Update reservation status
    reservation.refundStatus = 'failed';
    await reservation.save();

    console.log(`✅ Updated Reservation refundStatus to: failed`);

    // Update cancellation record
    const cancellation = await Cancellation.findOneAndUpdate(
      { reservation: reservation._id },
      {
        refundStatus: 'failed',
        status: 'failed',
        notes: `Refund failed with reason: ${refund.reason_code || 'Unknown'}`,
      },
      { new: true }
    );

    // Send failure notification email
    const guest = reservation.guest;
    const listing = reservation.listing;

    const userObj = {
      email: guest.email,
      name: guest.firstName || guest.email.split('@')[0],
      username: guest.firstName || guest.email.split('@')[0],
    };

    const reservationObj = {
      _id: reservation._id,
      checkIn: reservation.checkInDate,
      checkOut: reservation.checkOutDate,
      numberOfGuests: (reservation.adults || 0) + (reservation.children || 0),
      numberOfNights: Math.ceil(
        (new Date(reservation.checkOutDate) - new Date(reservation.checkInDate)) /
          (1000 * 60 * 60 * 24)
      ),
      totalPrice: reservation.totalAmount,
    };

    const listingObj = {
      _id: listing._id,
      title: listing.title,
      location: listing.location,
    };

    const refundInfo = {
      amount: reservation.refundAmount,
      percentage: reservation.refundPercentage,
      originalAmount: reservation.totalAmount,
      transactionId: refund.id,
    };

    // Send refund failed email to user
    await sendRefundFailedEmail(userObj, reservationObj, listingObj, refundInfo).catch((err) =>
      console.error('Failed to send refund failed email:', err)
    );

    console.log(
      `⚠️  REFUND FAILED for reservation: ${reservation._id}. Reason: ${refund.reason_code}`
    );
    console.log(`=====================================\n`);
  } catch (err) {
    console.error('❌ Error handling refund.failed:', err);
  }
};
