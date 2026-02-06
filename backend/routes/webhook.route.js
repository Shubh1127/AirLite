const express = require('express');
const router = express.Router();
const webhookController = require('../controllers/webhook.controller');

/* =========================
   WEBHOOK ROUTES
========================= */

/**
 * Razorpay Webhook Handler
 * This endpoint receives webhook events from Razorpay
 * DO NOT require authentication for webhooks
 */
router.post('/razorpay', webhookController.handleWebhook);

module.exports = router;
