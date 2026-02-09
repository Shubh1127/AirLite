# AirLite Backend

Welcome to the AirLite backend server! This is the Express.js API that powers the AirLite property rental platform.

## 📋 Project Overview

AirLite is a full-stack property rental application similar to Airbnb. The backend handles:
- User authentication and management
- Property listing creation and management
- Reservations and bookings
- Payment processing (Razorpay & Stripe integration)
- Reviews and ratings
- Wishlist management
- Email notifications
- Webhook handling for payment confirmations

## 🚀 Quick Start

### Prerequisites
- Node.js v20.12.2
- MongoDB (local or Atlas)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the backend root with the following variables:
```env
# Database
ATLASDB_URL=mongodb+srv://user:password@cluster.mongodb.net/database_name
NODE_ENV=development

# Authentication
SECRET=your_secret_key_for_jwt

# Email Configuration
SENDGRID_API_KEY=your_sendgrid_api_key
MAIL_USER=your_email@gmail.com
MAIL_PASS=your_app_password

# Cloud Storage
CLOUD_NAME=your_cloudinary_name
CLOUD_API_KEY=your_cloudinary_api_key
CLOUD_API_SECRET=your_cloudinary_api_secret

# Maps & Geolocation
MAP_TOKEN=your_mapbox_token

# Payment Gateways
RAZORPAY_KEY_ID=your_razorpay_key
RAZORPAY_KEY_SECRET=your_razorpay_secret
STRIPE_SECRET_KEY=your_stripe_secret_key

# Frontend URLs
FRONTEND_URL=http://localhost:3000
```

3. Start the development server:
```bash
npm start
```

The server will run on `http://localhost:8080`

## 📁 Directory Structure

```
backend/
├── app.js                 # Express application entry point
├── Schema.js              # JOI validation schemas
├── package.json           # Dependencies and scripts
├── config/                # Configuration files (Cloudinary, Mail)
├── controllers/           # Route handlers and business logic
├── init/                  # Database initialization and migration scripts
├── middlewares/           # Custom middleware functions
├── models/                # MongoDB schema definitions
├── routes/                # API route definitions
└── utils/                 # Utility functions and helpers
```

## 🔧 Key Features

### Authentication
- JWT-based authentication
- Email verification
- Password reset functionality
- Role-based access control

### Property Management
- Create, read, update, delete listings
- Image upload to Cloudinary
- Location search and suggestions via Mapbox
- Price calculations with taxes and fees

### Reservations
- Booking management
- Cancellation policies
- Refund processing and tracking
- Automated email notifications

### Payments
- Razorpay integration
- Stripe support (partial)
- Webhook handling for payment confirmations
- Transaction logging

### Reviews & Ratings
- User reviews for properties
- Star ratings (1-5)
- Review moderation

### Wishlist
- User favorites management
- Quick access to saved listings

## 📚 Directory Documentation

For detailed information about each directory, see:
- [config/README.md](./config/README.md) - Configuration setup
- [controllers/README.md](./controllers/README.md) - Route handlers
- [init/README.md](./init/README.md) - Database initialization
- [middlewares/README.md](./middlewares/README.md) - Middleware functions
- [models/README.md](./models/README.md) - Database models
- [routes/README.md](./routes/README.md) - API endpoints
- [utils/README.md](./utils/README.md) - Utility functions

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/logout` - User logout

### Listings
- `GET /api/listings` - Get all listings
- `GET /api/listings/:id` - Get single listing
- `POST /api/listings` - Create new listing (authenticated)
- `PUT /api/listings/:id` - Update listing
- `DELETE /api/listings/:id` - Delete listing
- `GET /api/listings/user/my-listings` - Get user's listings

### Reservations
- `GET /api/reservations` - Get reservations
- `POST /api/reservations` - Create reservation
- `PUT /api/reservations/:id` - Update reservation
- `DELETE /api/reservations/:id` - Cancel reservation

### Payments
- `POST /api/payments/create-order` - Create payment order
- `POST /api/webhooks/razorpay` - Razorpay webhook

### Reviews
- `GET /api/reviews/:listingId` - Get reviews for listing
- `POST /api/reviews` - Create review (authenticated)
- `DELETE /api/reviews/:id` - Delete review

### Wishlist
- `GET /api/wishlist` - Get user's wishlist
- `POST /api/wishlist/:listingId` - Add to wishlist
- `DELETE /api/wishlist/:listingId` - Remove from wishlist

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `POST /api/users/verify-email` - Verify email

## 🗄️ Database Models

The backend uses MongoDB with the following models:
- **User** - User accounts and profiles
- **Listing** - Property listings
- **Reservation** - Booking records
- **Review** - User reviews and ratings
- **Wishlist** - User favorites
- **Cancellation** - Cancellation policy rules

## 🔐 Middleware

- **Authentication** - JWT verification and session management
- **Email Verification** - Ensures email is verified before certain actions
- **File Upload** - Multer configuration for image uploads
- **Error Handling** - Custom error handling and logging

## 📧 Email Service

The backend sends transactional emails for:
- User registration and verification
- Reservation confirmations
- Payment receipts
- Refund notifications
- Listing creation confirmations

Emails are configured via SendGrid or Nodemailer.

## 🚨 Error Handling

Custom error handling is implemented via `ExpressError` utility. All errors are caught and returned with appropriate HTTP status codes and messages.

## 📝 Validation

Input validation is performed using JOI schema at the controller level:
- Listing schema
- Review schema
- User schema

## 🧪 Testing

Currently, there are no automated tests. Consider implementing:
- Unit tests for utility functions
- Integration tests for API endpoints
- Mock payment testing

```bash
# Run tests (when implemented)
npm test
```

## 🤝 Contributing

When adding new features:
1. Create new models in `/models`
2. Create controllers in `/controllers`
3. Create routes in `/routes`
4. Add middleware if needed in `/middlewares`
5. Add utility functions in `/utils`
6. Update this README with new endpoints

## 📜 License

ISC

## 🔗 Related

- Frontend: [../frontend](../frontend)
- Documentation: 
  - [EMAIL_SETUP_GUIDE.md](../EMAIL_SETUP_GUIDE.md)
  - [REFUND_SETUP_GUIDE.md](../REFUND_SETUP_GUIDE.md)
  - [WEBHOOK_SETUP.md](../WEBHOOK_SETUP.md)

## 🐛 Troubleshooting

### MongoDB Connection Issues
- Verify `ATLASDB_URL` is correct
- Check network access in MongoDB Atlas
- Ensure IP is whitelisted

### Email Not Sending
- Verify SendGrid/Nodemailer credentials
- Check email templates in `utils/emailTemplates.js`
- Review application logs

### Image Upload Failing
- Verify Cloudinary credentials
- Check image format (PNG, JPG, JPEG only)
- Ensure file size is within limits

### Payment Webhook Not Triggering
- Verify webhook URL is publicly accessible
- Check Razorpay webhook configuration
- Review webhook logs in `controllers/webhook.controller.js`

## 📞 Support

For issues or questions, refer to the documentation files in the root directory or contact the development team.
