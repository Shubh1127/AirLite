# Backend Controllers Directory

The `controllers/` directory contains all business logic and request handlers for the AirLite API. Controllers process incoming requests, interact with models, and return responses.

## 📋 Overview

Controllers follow the MVC (Model-View-Controller) pattern:
- **Models:** Database operations
- **Controllers:** Business logic and request handling
- **Routes:** Endpoint definitions

Each controller file handles requests for a specific resource (listings, users, payments, etc.).

## 📁 Files

### `listing.controller.js`
Handles all property listing operations.

**Key Functions:**
- `getAllListings()` - Retrieve all listings with filtering and pagination
- `getListingById(id)` - Get a specific listing by ID
- `getMyListings()` - Get current user's listings
- `createListing()` - Create a new listing
- `updateListing()` - Update existing listing
- `deleteListing()` - Delete a listing
- `getLocationSuggestions()` - Auto-complete location suggestions (Mapbox)
- `lookupAddress()` - Geocode address to coordinates

**Dependencies:**
- `Listing` model
- Mapbox Geocoding API
- Email utilities for notifications
- Cloudinary for image handling

**Authentication:** Most endpoints require `isLoggedIn` middleware

**Notable Features:**
- Image upload and management
- Address parsing and geocoding
- Location-based search
- Sends email notification on listing creation

---

### `user.controller.js`
Handles user authentication, registration, and profile management.

**Key Functions:**
- `register()` - Create new user account
- `login()` - Authenticate user and return JWT token
- `logout()` - Clear user session
- `getProfile()` - Get current user's profile
- `updateProfile()` - Update user information
- `verifyEmail()` - Verify email address
- `sendVerificationEmail()` - Trigger email verification
- `resetPassword()` - Password reset functionality

**Dependencies:**
- `User` model
- JWT for token generation
- Bcrypt for password hashing
- Email utilities

**Authentication:** Some endpoints require `isLoggedIn` middleware

**Notable Features:**
- Password hashing with bcrypt
- JWT token generation
- Email verification flow
- Profile picture upload

---

### `reservation.controller.js` (payment.controller.js)
Handles booking and reservation operations.

**Key Functions:**
- `createReservation()` - Create a new booking
- `getReservations()` - Get user's reservations
- `cancelReservation()` - Cancel an existing reservation
- `updateReservationStatus()` - Update booking status
- `getReservationDetails()` - Get detailed reservation info

**Dependencies:**
- `Reservation` model
- `Listing` model
- Payment processing
- Email utilities

**Authentication:** Requires `isLoggedIn` middleware

**Notable Features:**
- Price calculation with taxes and fees
- Availability checking
- Cancellation policy enforcement
- Sends confirmation and cancellation emails

---

### `payment.controller.js`
Handles payment processing and order management.

**Key Functions:**
- `createOrder()` - Create payment order (Razorpay/Stripe)
- `verifyPayment()` - Verify payment after completion
- `getPaymentStatus()` - Check payment status
- `initiateRefund()` - Start refund process
- `trackRefund()` - Track refund status
- `getTransactionHistory()` - Get user's payment history

**Dependencies:**
- Razorpay SDK
- Stripe SDK
- Reservation model
- Email utilities
- Refund utilities

**Authentication:** Requires `isLoggedIn` middleware

**Notable Features:**
- Razorpay integration (primary)
- Stripe support (partial)
- Refund processing and tracking
- Transaction logging
- Webhook integration for payment confirmations

See [../REFUND_SETUP_GUIDE.md](../REFUND_SETUP_GUIDE.md) for payment details.

---

### `review.controller.js`
Handles user reviews and ratings.

**Key Functions:**
- `createReview()` - Post a new review
- `getReviewsByListing()` - Get all reviews for a property
- `getReviewsByUser()` - Get current user's reviews
- `updateReview()` - Edit existing review
- `deleteReview()` - Remove a review
- `getAverageRating()` - Calculate average listing rating

**Dependencies:**
- `Review` model
- `Listing` model
- `User` model
- Authorization checks

**Authentication:** Requires `isLoggedIn` middleware for write operations

**Validation:**
- Rating must be 1-5
- Comment required
- Only listing guests can review

---

### `wishlist.controller.js`
Handles user wishlist and favorite listings.

**Key Functions:**
- `addToWishlist()` - Add listing to favorites
- `removeFromWishlist()` - Remove from favorites
- `getWishlist()` - Get user's wishlist
- `isInWishlist()` - Check if listing is favorited
- `clearWishlist()` - Clear all wishlist items

**Dependencies:**
- `Wishlist` model
- `Listing` model
- Authorization checks

**Authentication:** Requires `isLoggedIn` middleware

**Notable Features:**
- Quick access to favorite listings
- Prevents duplicate entries
- Efficient queries for performance

---

### `webhook.controller.js`
Handles webhook events from payment providers.

**Key Functions:**
- `handleRazorpayWebhook()` - Process Razorpay payment events
- `handleStripeWebhook()` - Process Stripe payment events
- `verifyWebhookSignature()` - Validate webhook authenticity

**Dependencies:**
- Razorpay SDK
- Stripe SDK
- Reservation model
- Payment model
- Email utilities

**Security:** Raw body verification for signature validation

**Notable Events:**
- `payment.authorized` - Payment successful
- `payment.failed` - Payment failed
- `refund.created` - Refund initiated
- `refund.completed` - Refund completed

See [../WEBHOOK_SETUP.md](../WEBHOOK_SETUP.md) for webhook configuration.

---

## 🏗️ Controller Structure Pattern

Each controller follows this pattern:

```javascript
const Model = require('../models/model.model');

// Function for GET all
exports.getAll = async (req, res, next) => {
  try {
    const items = await Model.find();
    res.json({ success: true, data: items });
  } catch (err) {
    next(err);
  }
};

// Function for GET one
exports.getById = async (req, res, next) => {
  try {
    const item = await Model.findById(req.params.id);
    res.json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
};

// Function for CREATE
exports.create = async (req, res, next) => {
  try {
    // Validate input
    // Create record
    // Return response
    res.status(201).json({ success: true, data: newItem });
  } catch (err) {
    next(err);
  }
};

// Similar pattern for UPDATE and DELETE
```

---

## 🔐 Authentication & Authorization

### Authentication Middleware
- `isLoggedIn` - Verifies JWT token in Authorization header
- `requireEmailVerification` - Ensures user has verified email

### Authorization Checks
Controllers verify the user owns the resource before allowing updates/deletions:

```javascript
// Check if user is the listing owner
if (req.params.userId !== req.user.id) {
  throw new ExpressError('Unauthorized', 403);
}
```

---

## 📧 Email Integration

Controllers trigger emails for important events:

```javascript
const { sendListingCreatedEmail } = require('../utils/mail.util');

// After creating listing
await sendListingCreatedEmail(user.email, listing);
```

Email templates are in [../utils/emailTemplates.js](../utils/emailTemplates.js)

---

## 🔗 Related Files

- [../routes/](../routes/) - Route definitions that call these controllers
- [../models/](../models/) - Database models used for data operations
- [../middlewares/](../middlewares/) - Middleware used for authentication
- [../utils/mail.util.js](../utils/mail.util.js) - Email utilities
- [../utils/refund.util.js](../utils/refund.util.js) - Refund processing

---

## 📝 Error Handling

All controllers use try-catch blocks and pass errors to Express error handler:

```javascript
try {
  // Controller logic
} catch (err) {
  next(err); // Pass to error middleware
}
```

Custom errors use `ExpressError` utility:
```javascript
const ExpressError = require('../utils/ExpressError.util');
throw new ExpressError('Message', statusCode);
```

---

## 🚀 Best Practices

1. **Consistent Structure** - All controllers follow similar patterns
2. **Error Handling** - All operations wrapped in try-catch
3. **Validation** - Input validated before processing
4. **Security** - Authorization checks on sensitive operations
5. **Logging** - Important operations logged for debugging
6. **Response Format** - Consistent JSON response structure
7. **Async/Await** - Modern async patterns instead of callbacks

---

## 🧪 Testing Controller Functions

When testing controllers:

```javascript
// Mock request, response, and next
const mockReq = { user: { id: '123' }, body: {} };
const mockRes = { json: jest.fn(), status: jest.fn() };
const mockNext = jest.fn();

// Call controller function
await listingController.getAll(mockReq, mockRes, mockNext);

// Assert
expect(mockRes.json).toHaveBeenCalled();
```

---

## 📚 Resources

- [Express.js Guide](https://expressjs.com/)
- [Mongoose Documentation](https://mongoosejs.com/)
- [JWT Guide](https://jwt.io/)
- [Razorpay API](https://razorpay.com/docs/api/)
- [Stripe API](https://stripe.com/docs/api)

