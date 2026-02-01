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

module.exports = router;
