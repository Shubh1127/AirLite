// const express = require('express');
// const router = express.Router();
// const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// router.post('/create-payment-intent', async (req, res) => {
//     const { amount, currency } = req.body;

//     try {
//         const paymentIntent = await stripe.paymentIntents.create({
//             amount,
//             currency,
//             // You can include additional metadata or configuration here
//         });

//         res.status(200).json({
//             clientSecret: paymentIntent.client_secret,
//         });

        
//     } catch (error) {
//         console.error("Payment Intent Creation Error:", error);
//         res.status(500).json({ error: error.message });
//     }
// });

// module.exports = router;
