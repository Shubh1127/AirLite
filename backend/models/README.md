# Backend Models Directory

The `models/` directory contains MongoDB schema definitions using Mongoose. Each file defines the structure, validation, and methods for a database collection.

## 📋 Overview

Mongoose models provide:
- Schema definition and validation
- Database methods and queries
- Data integrity enforcement
- Virtual properties and computed fields
- Middleware (hooks) for pre/post operations

## 📁 Files

### `user.model.js`
Defines the User schema for authentication and user management.

**Fields:**
- `username` - Unique username (String, required)
- `email` - User email (String, required, unique)
- `password` - Hashed password (String, required)
- `firstName` - First name (String)
- `lastName` - Last name (String)
- `profilePicture` - User avatar URL (String)
- `phone` - Contact number (String)
- `bio` - User bio/description (String)
- `address` - User's address object
- `isEmailVerified` - Email verification status (Boolean, default: false)
- `role` - User role: 'user' or 'host' (String, default: 'user')
- `createdAt` - Account creation timestamp (Date)
- `updatedAt` - Last update timestamp (Date)

**Methods:**
- Password hashing with bcrypt
- Email verification
- Profile completeness check

**Validation:**
- Email format validation
- Username uniqueness
- Required fields

**Usage:**
```javascript
const User = require('../models/user.model');
const user = await User.findById(userId);
const newUser = await User.create({ email, username, password });
```

---

### `listing.model.js`
Defines the Listing/Property schema for rental listings.

**Fields:**
- `title` - Listing title (String, required)
- `description` - Detailed description (String)
- `images` - Array of image URLs and filenames
- `pricePerNight` - Nightly rate (Number, required)
- `cleaningFee` - Cleaning charge (Number)
- `serviceFee` - Platform fee (Number)
- `tax` - Tax amount (Number)
- `location` - City/area name (String)
- `country` - Country (String)
- `address` - Detailed address object (street, city, state, zipCode)
- `coordinates` - Geolocation [longitude, latitude]
- `amenities` - Array of amenities (WiFi, Pool, Kitchen, etc.)
- `bedrooms` - Number of bedrooms (Number)
- `beds` - Total beds (Number)
- `bathrooms` - Number of bathrooms (Number)
- `maxGuests` - Maximum occupancy (Number)
- `owner` - Reference to User model (ObjectId)
- `reviews` - Array of review references
- `averageRating` - Computed average rating (Number)
- `isActive` - Listing status (Boolean, default: true)
- `createdAt` - Creation timestamp (Date)
- `updatedAt` - Last update timestamp (Date)

**Relationships:**
- `owner` → User model (one-to-many)
- `reviews` → Review model (one-to-many)

**Indexes:**
- Location-based indexing for search
- Owner index for quick lookups
- Creation date index for sorting

**Usage:**
```javascript
const Listing = require('../models/listing.model');
const listings = await Listing.find();
const listing = await Listing.findById(id).populate('owner reviews');
```

---

### `reservation.model.js`
Defines the Reservation schema for bookings.

**Fields:**
- `listing` - Reference to Listing (ObjectId, required)
- `guest` - Reference to User (ObjectId, required)
- `host` - Reference to User (ObjectId, calculated from listing)
- `checkInDate` - Check-in date (Date, required)
- `checkOutDate` - Check-out date (Date, required)
- `numberOfGuests` - Guest count (Number, required)
- `numberOfNights` - Calculated nights (Number)
- `pricePerNight` - Price at time of booking (Number)
- `totalPrice` - Base price total (Number)
- `cleaningFee` - Applied cleaning fee (Number)
- `serviceFee` - Applied service fee (Number)
- `tax` - Applied tax (Number)
- `grandTotal` - Final amount to pay (Number)
- `status` - Current status (String)
  - `pending` - Payment awaiting
  - `confirmed` - Booking confirmed
  - `cancelled` - Cancelled by guest
  - `completed` - Reservation past
- `paymentStatus` - Payment state (String)
  - `unpaid`
  - `paid`
  - `refunded`
- `cancellationPolicy` - Policy type (String)
  - `flexible`
  - `moderate`
  - `strict`
- `cancellationReason` - Cancellation details (String)
- `refundAmount` - Refund amount if cancelled (Number)
- `createdAt` - Booking creation (Date)
- `updatedAt` - Last update (Date)

**Relationships:**
- `listing` → Listing model
- `guest` → User model
- `host` → User model (via listing)

**Validation:**
- Check-out date must be after check-in
- Check-in date must be future date
- Listing availability check

**Usage:**
```javascript
const Reservation = require('../models/reservation.model');
const reservation = await Reservation.create({
  listing: listingId,
  guest: guestId,
  checkInDate: new Date('2025-03-01'),
  checkOutDate: new Date('2025-03-07'),
  numberOfGuests: 2
});
```

---

### `review.model.js`
Defines the Review schema for user ratings and comments.

**Fields:**
- `listing` - Reference to Listing (ObjectId, required)
- `guest` - Reference to User reviewing (ObjectId, required)
- `host` - Reference to User being reviewed (ObjectId, auto-populated from listing)
- `rating` - Star rating 1-5 (Number, required, min: 1, max: 5)
- `comment` - Review text (String)
- `categories` - Breakdown ratings object:
  - `cleanliness` - 1-5
  - `communication` - 1-5
  - `accuracy` - 1-5
  - `location` - 1-5
  - `value` - 1-5
- `isVerified` - Guest actually stayed (Boolean)
- `helpful` - Helpful vote count (Number, default: 0)
- `createdAt` - Review date (Date)
- `updatedAt` - Edit date (Date)

**Relationships:**
- `listing` → Listing model
- `guest` → User model
- `host` → User model

**Constraints:**
- One review per guest per listing
- Only guests can review
- Can only review after checkout date
- Rating required, comment optional

**Usage:**
```javascript
const Review = require('../models/review.model');
const review = await Review.create({
  listing: listingId,
  guest: userId,
  rating: 5,
  comment: 'Amazing place!'
});
```

---

### `wishlist.model.js`
Defines the Wishlist schema for saved favorites.

**Fields:**
- `user` - Reference to User (ObjectId, required)
- `listings` - Array of Listing references (ObjectId array)
- `createdAt` - Wishlist creation (Date)
- `updatedAt` - Last modification (Date)

**Relationships:**
- `user` → User model (one-to-one)
- `listings` → Listing model (many-to-many via array)

**Methods:**
- Add to wishlist
- Remove from wishlist
- Clear all favorites
- Check if listing in wishlist

**Usage:**
```javascript
const Wishlist = require('../models/wishlist.model');
const wishlist = await Wishlist.findOne({ user: userId });
wishlist.listings.push(listingId);
await wishlist.save();
```

---

### `cancellation.model.js`
Defines cancellation policies for reservations.

**Fields:**
- `name` - Policy name (String)
  - `flexible`
  - `moderate`
  - `strict`
- `description` - Policy details (String)
- `refundPercentage` - Refund % by days before checkout:
  - `fullRefund` - Full refund deadline (Number, days)
  - `halfRefund` - 50% refund deadline (Number, days)
  - `noRefund` - No refund deadline (Number, days)
- `isActive` - Policy enabled (Boolean)

**Usage:**
```javascript
const Cancellation = require('../models/cancellation.model');
const flexiblePolicy = await Cancellation.findOne({ name: 'flexible' });
```

**Predefined Policies:**
- **Flexible:** Full refund up to 7 days before, 50% up to 3 days
- **Moderate:** 50% refund up to 14 days, no refund after
- **Strict:** No refund for cancellations

---

## 🏗️ Model Methods & Hooks

### Pre-Save Hooks
Models can use MongoDB middleware:

```javascript
// Hash password before saving user
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});
```

### Virtual Properties
Computed properties not stored in DB:

```javascript
// Calculate total listing reviews
listingSchema.virtual('reviewCount').get(function() {
  return this.reviews.length;
});
```

### Instance Methods
Methods available on model instances:

```javascript
// Example: Check if user is host
userSchema.methods.isHost = function() {
  return this.role === 'host';
};
```

---

## 🔗 Model Relationships

**Diagram:**
```
User (1) -------- (many) Listing
  |                         |
  |(guest)            (many)Reservation
  |                         |
  +------- (many) Reservation
           |
           +--- Listing
           
Listing (1) -------- (many) Review
User (1) ----------- (1) Wishlist
Wishlist (1) -------- (many) Listing
```

---

## 🔐 Data Validation

Models validate data before saving:

```javascript
// Example: Email format validation
userSchema.path('email').validate(function(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}, 'Invalid email format');
```

Use `Schema.validate()` for complex validation.

---

## 📊 Querying Models

Common query patterns:

```javascript
// Find with exact match
await User.findOne({ email: 'user@example.com' });

// Find with conditions
await Listing.find({ country: 'India', isActive: true });

// Populate relationships
await Reservation.findById(id).populate('listing guest host');

// Aggregate for statistics
await Listing.aggregate([
  { $match: { owner: userId } },
  { $group: { _id: '$country', count: { $sum: 1 } } }
]);

// Sort and limit
await Listing.find().sort({ createdAt: -1 }).limit(10);
```

---

## 🧹 Indexes for Performance

Models define indexes for frequently queried fields:

```javascript
// Compound index example
listingSchema.index({ owner: 1, createdAt: -1 });

// Text search index
listingSchema.index({ title: 'text', description: 'text' });

// Geospatial index
listingSchema.index({ coordinates: '2dsphere' });
```

---

## 📈 Best Practices

1. **Define Relationships** - Use ref for document references
2. **Add Validation** - Enforce data integrity at schema level
3. **Create Indexes** - Add indexes for frequently queried fields
4. **Use Pre-Save Hooks** - Hash passwords, set defaults
5. **Populate Relationships** - Use `.populate()` for nested data
6. **Consistent Timestamps** - Use `createdAt` and `updatedAt`
7. **Documentation** - Comment complex fields and methods

---

## 🔗 Related Files

- [../controllers/](../controllers/) - Uses models for database operations
- [Schema.js](../Schema.js) - JOI validation schemas
- [../utils/refund.util.js](../utils/refund.util.js) - Refund calculations on Reservation

---

## 📚 Resources

- [Mongoose Documentation](https://mongoosejs.com/)
- [MongoDB Manual](https://docs.mongodb.com/manual/)
- [Schema Design Guide](https://mongoosejs.com/docs/guide.html)
- [Query Documentation](https://mongoosejs.com/docs/queries.html)

