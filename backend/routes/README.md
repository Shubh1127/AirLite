# Backend Routes Directory

The `routes/` directory contains API endpoint definitions. Each file defines routes for a specific resource and connects them to their corresponding controllers and middleware.

## 📋 Overview

Routes organize API endpoints into logical groups:
- Define HTTP methods (GET, POST, PUT, DELETE)
- Apply middleware for authentication, validation, file upload
- Map endpoints to controller functions
- Document available endpoints

## 📁 Files

### `listing.route.js`
Defines all endpoints for property listing operations.

**Endpoints:**

#### GET Requests
```
GET /api/listings
  - Get all listings
  - Public endpoint
  - Query params: page, limit, filter, sort
  - Returns: Array of listings with metadata
  
GET /api/listings/:id
  - Get single listing by ID
  - Public endpoint
  - Params: id (MongoDB ObjectId)
  - Returns: Full listing details with reviews
  
GET /api/listings/user/my-listings
  - Get current user's listings
  - Auth required (isLoggedIn)
  - Returns: Array of user's own listings
  
GET /api/listings/suggestions
  - Get location auto-complete suggestions
  - Query param: query (text to search)
  - Uses Mapbox geocoding
  - Returns: Array of location suggestions
  
GET /api/listings/address-lookup
  - Lookup address coordinates
  - Query params: address
  - Returns: Geographic coordinates
```

#### POST Requests
```
POST /api/listings
  - Create new listing
  - Auth required (isLoggedIn)
  - Email verification required (requireEmailVerification)
  - File upload: images (up to 5)
  - Body:
    {
      title: String,
      description: String,
      location: String,
      country: String,
      price: Number,
      address: {street, city, state, zipCode},
      amenities: Array,
      bedrooms: Number,
      bathrooms: Number,
      maxGuests: Number
    }
  - Returns: Created listing object
  - Side effects: Sends email notification to host
```

#### PUT Requests
```
PUT /api/listings/:id
  - Update existing listing
  - Auth required (isLoggedIn)
  - Owner verification required
  - File upload: images (up to 5)
  - Body: Partial or full listing object
  - Returns: Updated listing object
```

#### DELETE Requests
```
DELETE /api/listings/:id
  - Delete a listing
  - Auth required (isLoggedIn)
  - Owner verification required
  - Returns: Success message
```

**Middleware Chain:**
- `isLoggedIn` - Check authentication
- `requireEmailVerification` - Verify email
- `upload.array('images', 5)` - Handle file uploads

---

### `user.route.js`
Defines endpoints for user authentication and profile management.

**Endpoints:**

```
POST /api/users/register
  - Create new user account
  - Public endpoint
  - Body: { email, username, password, firstName, lastName }
  - Returns: User object + JWT token
  
POST /api/users/login
  - Authenticate user
  - Public endpoint
  - Body: { email, password }
  - Returns: User object + JWT token
  
POST /api/users/logout
  - Clear session
  - Auth required
  - Returns: Success message
  
GET /api/users/profile
  - Get current user's profile
  - Auth required (isLoggedIn)
  - Returns: Complete user object
  
PUT /api/users/profile
  - Update user profile
  - Auth required (isLoggedIn)
  - Body: { firstName, lastName, phone, bio, profilePicture }
  - Returns: Updated user object
  
POST /api/users/verify-email
  - Verify email address
  - Query param: token
  - Returns: Success message
  
POST /api/users/resend-verification
  - Resend verification email
  - Auth required
  - Returns: Success message
  
POST /api/users/reset-password
  - Request password reset
  - Body: { email }
  - Returns: Success message
  
PUT /api/users/reset-password/:token
  - Complete password reset
  - Body: { password, confirmPassword }
  - Returns: Success message
```

**Authentication Methods:**
- JWT in Authorization header
- Session-based (optional)

---

### `payment.route.js`
Defines payment processing and order management endpoints.

**Endpoints:**

```
POST /api/payments/create-order
  - Create payment order
  - Auth required (isLoggedIn)
  - Body: { reservationId, amount, currency }
  - Returns: Razorpay/Stripe order object with order_id
  
POST /api/payments/verify-payment
  - Verify successful payment
  - Auth required (isLoggedIn)
  - Body: { orderId, paymentId, signature }
  - Returns: Success/failure status
  
GET /api/payments/status/:orderId
  - Get payment status
  - Auth required (isLoggedIn)
  - Returns: Payment details and status
  
POST /api/payments/refund
  - Initiate refund
  - Auth required (isLoggedIn)
  - Body: { reservationId, reason }
  - Returns: Refund details
  
GET /api/payments/refund-status/:refundId
  - Track refund progress
  - Auth required (isLoggedIn)
  - Returns: Refund details and status
  
GET /api/payments/history
  - Get user's payment history
  - Auth required (isLoggedIn)
  - Query params: page, limit
  - Returns: Array of transactions
```

**Payment Providers:**
- Razorpay (primary)
- Stripe (secondary)

**Response Format:**
```javascript
{
  success: Boolean,
  orderId: String,
  amount: Number,
  currency: String,
  status: String
}
```

See [../REFUND_SETUP_GUIDE.md](../REFUND_SETUP_GUIDE.md) for payment details.

---

### `reviews.route.js`
Defines endpoints for review management.

**Endpoints:**

```
GET /api/reviews/:listingId
  - Get reviews for listing
  - Public endpoint
  - Params: listingId (MongoDB ObjectId)
  - Query params: page, limit, sort
  - Returns: Array of reviews with ratings
  
POST /api/reviews
  - Create review
  - Auth required (isLoggedIn)
  - Body:
    {
      listing: ObjectId,
      rating: Number (1-5),
      comment: String,
      categories: {
        cleanliness: Number,
        communication: Number,
        accuracy: Number,
        location: Number,
        value: Number
      }
    }
  - Returns: Created review object
  
PUT /api/reviews/:id
  - Update review
  - Auth required (isLoggedIn)
  - Owner verification required
  - Body: { rating, comment, categories }
  - Returns: Updated review object
  
DELETE /api/reviews/:id
  - Delete review
  - Auth required (isLoggedIn)
  - Owner verification required
  - Returns: Success message
  
GET /api/reviews/user/my-reviews
  - Get current user's reviews
  - Auth required (isLoggedIn)
  - Query params: page, limit
  - Returns: Array of user's reviews
```

**Validation:**
- Rating: 1-5 only
- One review per guest per listing
- Only past guests can review

---

### `wishlist.route.js`
Defines endpoints for managing saved listings.

**Endpoints:**

```
GET /api/wishlist
  - Get user's wishlist
  - Auth required (isLoggedIn)
  - Query params: page, limit, sort
  - Returns: Array of wishlisted listings
  
POST /api/wishlist/:listingId
  - Add listing to wishlist
  - Auth required (isLoggedIn)
  - Params: listingId (MongoDB ObjectId)
  - Returns: Updated wishlist
  
DELETE /api/wishlist/:listingId
  - Remove from wishlist
  - Auth required (isLoggedIn)
  - Params: listingId (MongoDB ObjectId)
  - Returns: Updated wishlist
  
DELETE /api/wishlist
  - Clear entire wishlist
  - Auth required (isLoggedIn)
  - Returns: Success message
  
GET /api/wishlist/check/:listingId
  - Check if listing in wishlist
  - Auth required (isLoggedIn)
  - Returns: { isWishlisted: Boolean }
```

**Response Format:**
```javascript
{
  success: Boolean,
  wishlist: {
    listings: [Array of Listing objects],
    count: Number
  }
}
```

---

### `webhook.route.js`
Defines webhook endpoints for payment provider notifications.

**Endpoints:**

```
POST /api/webhooks/razorpay
  - Razorpay payment webhook
  - Public endpoint (but signature verified)
  - Raw body required (express.raw())
  - Events:
    - payment.authorized
    - payment.failed
    - refund.processed
    - refund.failed
  - Returns: 200 OK if processed
  
POST /api/webhooks/stripe
  - Stripe payment webhook
  - Public endpoint (but signature verified)
  - Raw body required
  - Events:
    - payment_intent.succeeded
    - payment_intent.payment_failed
    - charge.refunded
  - Returns: 200 OK if processed
```

**Security:**
- Signature verification using webhook secret
- Raw body preservation for verification
- MUST be registered BEFORE `express.json()`

See [../WEBHOOK_SETUP.md](../WEBHOOK_SETUP.md) for webhook setup.

---

## 🏗️ Route File Structure Pattern

Each route file follows this structure:

```javascript
const express = require('express');
const router = express.Router();

const controller = require('../controllers/feature.controller');
const { isLoggedIn } = require('../middlewares/auth.middlware');
const { uploadMiddleware } = require('../middlewares/multer.middleware');

// PUBLIC routes
router.get('/', controller.getAll);
router.get('/:id', controller.getById);

// AUTHENTICATED routes
router.post('/', isLoggedIn, uploadMiddleware, controller.create);
router.put('/:id', isLoggedIn, controller.update);
router.delete('/:id', isLoggedIn, controller.delete);

module.exports = router;
```

---

## 🔐 Middleware Usage

### Authentication Middleware
```javascript
const { isLoggedIn } = require('../middlewares/auth.middlware');
router.post('/', isLoggedIn, controller.create); // Requires login
```

### Email Verification
```javascript
const { requireEmailVerification } = require('../middlewares/emailVerification.middleware');
router.post('/', isLoggedIn, requireEmailVerification, controller.create);
```

### File Upload
```javascript
const upload = require('../middlewares/multer.middleware');
router.post('/', upload.array('images', 5), controller.create);
router.post('/', upload.single('image'), controller.create);
```

---

## 📊 Common Response Patterns

**Success Response:**
```javascript
{
  success: true,
  data: { /* resource object */ },
  message: 'Operation completed successfully'
}
```

**Error Response:**
```javascript
{
  success: false,
  message: 'Error description',
  status: 400
}
```

**List Response:**
```javascript
{
  success: true,
  data: [ /* array of resources */ ],
  pagination: {
    page: 1,
    limit: 10,
    total: 50,
    pages: 5
  }
}
```

---

## 🔗 Route Registration

Routes are registered in `app.js`:

```javascript
const listingRoutes = require('./routes/listing.route');
const userRoutes = require('./routes/user.route');
const paymentRoutes = require('./routes/payment.route');
const reviewRoutes = require('./routes/reviews.route');
const wishlistRoutes = require('./routes/wishlist.route');
const webhookRoutes = require('./routes/webhook.route');

app.use('/api/listings', listingRoutes);
app.use('/api/users', userRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/webhooks', express.raw({ type: 'application/json' }), webhookRoutes);
```

---

## 📝 Query Parameters

Common query parameters across routes:

```
?page=1&limit=10         # Pagination
?sort=createdAt&order=-1 # Sorting (-1 for descending)
?filter=status:active    # Filtering
?search=keyword          # Text search
?select=field1,field2    # Field selection
```

---

## ⚙️ Best Practices

1. **Consistent naming** - Follow RESTful conventions
2. **Logical grouping** - Group related endpoints in one file
3. **Middleware order** - Webhook routes BEFORE express.json()
4. **Error handling** - Let controllers handle errors and pass to middleware
5. **Documentation** - Comment complex routes
6. **Validation** - Validate input in controllers, not routes
7. **Security** - Apply auth middleware before sensitive operations

---

## 🔗 Related Files

- [../controllers/](../controllers/) - Handler functions for routes
- [../middlewares/](../middlewares/) - Middleware used in routes
- [../app.js](../app.js) - Where routes are registered
- [../Schema.js](../Schema.js) - JOI validation schemas

---

## 📚 Resources

- [Express.js Routing](https://expressjs.com/en/guide/routing.html)
- [RESTful API Design](https://restfulapi.net/)
- [HTTP Status Codes](https://httpwg.org/specs/rfc7231.html#status.codes)
- [Middleware Guide](https://expressjs.com/en/guide/using-middleware.html)

