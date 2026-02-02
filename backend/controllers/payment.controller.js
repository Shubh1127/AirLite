const Razorpay = require('razorpay');
const crypto = require('crypto');
const Reservation = require('../models/reservation.model');
const Listing = require('../models/listing.model');

// Validate Razorpay credentials
if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
  console.error('WARNING: Razorpay credentials not configured in .env file');
}

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/* =========================
   CREATE ORDER
========================= */
exports.createOrder = async (req, res) => {
  try {
    const {
      listingId,
      checkInDate,
      checkOutDate,
      adults,
      children,
      infants,
      pets,
      guestMessage,
      totalAmount,
    } = req.body;

    // Validate inputs
    if (!listingId || !checkInDate || !checkOutDate || !totalAmount) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const listing = await Listing.findById(listingId);
    if (!listing) {
      return res.status(404).json({ message: 'Listing not found' });
    }

    // Create Razorpay order
    const options = {
      amount: Math.round(totalAmount * 100), // Amount in paise
      currency: 'INR',
      receipt: `booking_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);

    // Create reservation record (pending payment)
    const reservation = await Reservation.create({
      listing: listingId,
      guest: req.user.id,
      checkInDate,
      checkOutDate,
      adults,
      children,
      infants,
      pets,
      guestMessage,
      totalAmount,
      status: 'pending',
      razorpayOrderId: order.id,
    });

    res.json({
      orderId: order.id,
      reservationId: reservation._id,
      amount: totalAmount,
      currency: 'INR',
    });
  } catch (err) {
    console.error('Create order error:', err);
    
    // Provide more specific error messages
    if (err.statusCode === 401) {
      return res.status(401).json({ 
        message: 'Razorpay authentication failed. Please check your API keys. Use TEST keys (rzp_test_...) for development.' 
      });
    }
    
    res.status(500).json({ 
      message: err.error?.description || 'Failed to create order',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

/* =========================
   VERIFY PAYMENT
========================= */
exports.verifyPayment = async (req, res) => {
  try {
    const { orderId, paymentId, signature } = req.body;

    if (!orderId || !paymentId || !signature) {
      return res.status(400).json({ message: 'Missing payment details' });
    }

    // Verify signature
    const body = orderId + '|' + paymentId;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expectedSignature !== signature) {
      return res.status(400).json({ message: 'Invalid payment signature' });
    }

    // Update reservation
    const reservation = await Reservation.findOneAndUpdate(
      { razorpayOrderId: orderId },
      {
        status: 'confirmed',
        razorpayPaymentId: paymentId,
        razorpaySignature: signature,
        confirmedAt: new Date(),
      },
      { new: true }
    );

    if (!reservation) {
      return res.status(404).json({ message: 'Reservation not found' });
    }

    res.json({
      message: 'Payment verified successfully',
      reservation,
    });
  } catch (err) {
    console.error('Verify payment error:', err);
    res.status(500).json({ message: 'Payment verification failed' });
  }
};

/* =========================
   CANCEL RESERVATION & INITIATE REFUND
========================= */
exports.cancelReservation = async (req, res) => {
  try {
    const { reservationId } = req.params;
    const { cancellationReason } = req.body;

    const reservation = await Reservation.findById(reservationId).populate('listing');
    
    if (!reservation) {
      return res.status(404).json({ message: 'Reservation not found' });
    }

    // Check if user is the guest who made the reservation
    if (reservation.guest.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to cancel this reservation' });
    }

    // Check if already cancelled
    if (reservation.status === 'cancelled') {
      return res.status(400).json({ message: 'Reservation already cancelled' });
    }

    // Calculate refund based on cancellation policy
    const checkInDate = new Date(reservation.checkInDate);
    const now = new Date();
    const daysUntilCheckIn = Math.ceil((checkInDate - now) / (1000 * 60 * 60 * 24));
    
    const cancellationPolicy = reservation.listing.cancellationPolicy;
    let refundPercentage = 0;

    // Determine refund percentage based on policy type
    switch(cancellationPolicy.type) {
      case 'flexible':
        if (daysUntilCheckIn >= 1) refundPercentage = 100;
        else if (daysUntilCheckIn >= 7) refundPercentage = 50;
        break;
      case 'moderate':
        if (daysUntilCheckIn >= 5) refundPercentage = 100;
        else if (daysUntilCheckIn >= 1) refundPercentage = 50;
        break;
      case 'strict':
        if (daysUntilCheckIn >= 14) refundPercentage = 100;
        else if (daysUntilCheckIn >= 7) refundPercentage = 50;
        break;
      case 'non-refundable':
        refundPercentage = 0;
        break;
      default:
        refundPercentage = 0;
    }

    const refundAmount = (reservation.totalAmount * refundPercentage) / 100;

    // Update reservation
    reservation.status = refundAmount > 0 ? 'refund-pending' : 'cancelled';
    reservation.cancelledAt = new Date();
    reservation.cancellationReason = cancellationReason;
    reservation.refundAmount = refundAmount;
    reservation.refundPercentage = refundPercentage;
    reservation.refundStatus = refundAmount > 0 ? 'pending' : 'none';
    
    await reservation.save();

    // Initiate Razorpay refund if applicable
    if (refundAmount > 0 && reservation.razorpayPaymentId) {
      try {
        const refund = await razorpay.payments.refund(reservation.razorpayPaymentId, {
          amount: Math.round(refundAmount * 100), // Amount in paise
          speed: 'normal',
          notes: {
            reason: cancellationReason || 'Cancelled by user',
            reservationId: reservationId,
          }
        });

        reservation.refundTransactionId = refund.id;
        reservation.refundStatus = 'processing';
        await reservation.save();

        return res.json({
          message: 'Reservation cancelled and refund initiated',
          reservation,
          refund: {
            amount: refundAmount,
            percentage: refundPercentage,
            transactionId: refund.id,
          }
        });
      } catch (refundError) {
        console.error('Refund initiation error:', refundError);
        reservation.refundStatus = 'failed';
        await reservation.save();
        
        return res.status(500).json({
          message: 'Reservation cancelled but refund failed. Contact support.',
          reservation,
        });
      }
    }

    res.json({
      message: refundPercentage === 0 
        ? 'Reservation cancelled. No refund applicable as per cancellation policy.' 
        : 'Reservation cancelled successfully',
      reservation,
      refund: {
        amount: refundAmount,
        percentage: refundPercentage,
      }
    });
  } catch (err) {
    console.error('Cancel reservation error:', err);
    res.status(500).json({ message: 'Failed to cancel reservation' });
  }
};

/* =========================
   EDIT RESERVATION
========================= */
exports.editReservation = async (req, res) => {
  try {
    const { reservationId } = req.params;
    const { checkInDate, checkOutDate } = req.body;

    const reservation = await Reservation.findById(reservationId);
    
    if (!reservation) {
      return res.status(404).json({ message: 'Reservation not found' });
    }

    // Check authorization
    if (reservation.guest.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to edit this reservation' });
    }

    // Check if editing is allowed
    if (!reservation.canEdit || reservation.status === 'cancelled') {
      return res.status(400).json({ message: 'This reservation cannot be edited' });
    }

    // Check if edit is at least 48 hours before check-in
    const now = new Date();
    const existingCheckIn = new Date(reservation.checkInDate);
    const hoursUntilCheckIn = (existingCheckIn - now) / (1000 * 60 * 60);

    if (hoursUntilCheckIn < 48) {
      return res.status(400).json({ 
        message: 'Reservations can only be edited at least 48 hours before check-in' 
      });
    }

    // Save edit history
    reservation.editHistory.push({
      editedAt: new Date(),
      previousCheckIn: reservation.checkInDate,
      previousCheckOut: reservation.checkOutDate,
      newCheckIn: checkInDate,
      newCheckOut: checkOutDate,
      editedBy: req.user.id,
    });

    // Update dates
    reservation.checkInDate = checkInDate;
    reservation.checkOutDate = checkOutDate;
    
    await reservation.save();

    res.json({
      message: 'Reservation updated successfully',
      reservation,
    });
  } catch (err) {
    console.error('Edit reservation error:', err);
    res.status(500).json({ message: 'Failed to edit reservation' });
  }
};

/* =========================
   CHECK REFUND STATUS
========================= */
exports.checkRefundStatus = async (req, res) => {
  try {
    const { reservationId } = req.params;

    const reservation = await Reservation.findById(reservationId);
    
    if (!reservation) {
      return res.status(404).json({ message: 'Reservation not found' });
    }

    if (reservation.guest.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // If there's a refund transaction, fetch its status from Razorpay
    if (reservation.refundTransactionId) {
      try {
        const refund = await razorpay.refunds.fetch(reservation.refundTransactionId);
        
        // Update local status based on Razorpay status
        if (refund.status === 'processed') {
          reservation.refundStatus = 'completed';
          reservation.refundedAt = new Date(refund.created_at * 1000);
          reservation.status = 'refunded';
          await reservation.save();
        }
      } catch (error) {
        console.error('Error fetching refund status:', error);
      }
    }

    res.json({
      refundStatus: reservation.refundStatus,
      refundAmount: reservation.refundAmount,
      refundPercentage: reservation.refundPercentage,
      refundedAt: reservation.refundedAt,
      transactionId: reservation.refundTransactionId,
    });
  } catch (err) {
    console.error('Check refund status error:', err);
    res.status(500).json({ message: 'Failed to check refund status' });
  }
};