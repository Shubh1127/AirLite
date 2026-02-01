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
