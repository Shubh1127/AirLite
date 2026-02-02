const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');
const { isLoggedIn } = require('../middlewares/auth.middlware');

/* =========================
   PAYMENT ROUTES
========================= */

// Create order
router.post('/create-order', isLoggedIn, paymentController.createOrder);

// Verify payment
router.post('/verify-payment', isLoggedIn, paymentController.verifyPayment);

// Cancel reservation and initiate refund
router.post('/cancel-reservation/:reservationId', isLoggedIn, paymentController.cancelReservation);

// Edit reservation
router.put('/edit-reservation/:reservationId', isLoggedIn, paymentController.editReservation);

// Check refund status
router.get('/refund-status/:reservationId', isLoggedIn, paymentController.checkRefundStatus);

module.exports = router;
