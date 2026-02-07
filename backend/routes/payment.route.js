const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');
const { isLoggedIn } = require('../middlewares/auth.middlware');
const { requireEmailVerification } = require('../middlewares/emailVerification.middleware');

/* =========================
   PAYMENT ROUTES
========================= */

// Create order
router.post('/create-order', isLoggedIn, requireEmailVerification, paymentController.createOrder);

// Verify payment
router.post('/verify-payment', isLoggedIn, paymentController.verifyPayment);

// Cancel reservation and initiate refund
router.post('/cancel-reservation/:reservationId', isLoggedIn, paymentController.cancelReservation);

// Edit reservation
router.put('/edit-reservation/:reservationId', isLoggedIn, paymentController.editReservation);

// Check refund status
router.get('/refund-status/:reservationId', isLoggedIn, paymentController.checkRefundStatus);

// Get cancellation info
router.get('/cancellation-info/:reservationId', isLoggedIn, paymentController.getCancellationInfo);

/* =========================
   REFUND MANAGEMENT ROUTES
========================= */

// Update all pending refunds from Razorpay
router.post('/update-pending-refunds', isLoggedIn, paymentController.updatePendingRefunds);

// Get pending refunds statistics
router.get('/pending-refunds-stats', isLoggedIn, paymentController.getPendingRefundsStats);

// Get list of all pending refunds (for monitoring/testing)
router.get('/list-pending-refunds', isLoggedIn, paymentController.listPendingRefunds);

// Check specific refund status from Razorpay and update if needed
router.post('/check-refund/:reservationId', isLoggedIn, paymentController.checkSpecificRefundStatus);

module.exports = router;
