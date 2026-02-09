# Backend Middlewares Directory

The `middlewares/` directory contains custom Express middleware functions. Middleware processes requests before they reach route handlers, adding authentication, validation, file handling, and error management.

## 📋 Overview

Middleware in Express:
- Receives request and response objects
- Can modify request/response
- Decides whether to pass control to next middleware
- Executes in the order registered
- Critical for security, validation, and cross-cutting concerns

## 📁 Files

### `auth.middlware.js`
Handles JWT authentication and authorization checks.

**Functions:**

#### `isLoggedIn` Middleware
Verifies user is authenticated via JWT token.

**How it works:**
1. Checks if `req.user` exists (from session)
2. If not, looks for JWT token in Authorization header
3. Token format: `Bearer <token>`
4. Verifies token using `process.env.SECRET`
5. Decodes and attaches user to `req.user`

**Usage:**
```javascript
router.post('/protected', isLoggedIn, controller.protectedAction);
```

**Request Header:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**Error Responses:**
- **401 Unauthorized** - No token provided
- **401 Unauthorized** - Invalid token
- **500 Server Error** - SECRET not configured

**Code Flow:**
```javascript
exports.isLoggedIn = (req, res, next) => {
  // 1. Check session user
  if (req.user && req.user.id) {
    return next();
  }
  
  // 2. Extract token from Authorization header
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ')
    ? authHeader.replace('Bearer ', '')
    : null;
  
  // 3. Verify missing token
  if (!token) {
    return res.status(401).json({ message: 'You must be logged in' });
  }
  
  // 4. Verify JWT token
  try {
    const secret = process.env.SECRET;
    const decoded = jwt.verify(token, secret);
    req.user = decoded; // Attach user to request
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
  }
};
```

**Protected Routes Example:**
```javascript
router.get('/my-listings', isLoggedIn, listingController.getMyListings);
router.post('/listings', isLoggedIn, listingController.createListing);
```

---

#### `isListingOwner` Middleware (if present)
Checks if authenticated user owns the listing.

**Usage:**
```javascript
router.put('/listings/:id', isLoggedIn, isListingOwner, controller.updateListing);
```

---

### `emailVerification.middleware.js`
Requires users to have verified their email before certain actions.

**Functions:**

#### `requireEmailVerification` Middleware
Ensures user has completed email verification.

**How it works:**
1. Gets authenticated user (via isLoggedIn)
2. Checks `user.isEmailVerified` flag
3. Allows or blocks request
4. Prevents unverified users from listing properties

**Usage:**
```javascript
router.post('/listings', isLoggedIn, requireEmailVerification, upload.array('images'), controller.createListing);
```

**Error Response:**
```javascript
{
  status: 403,
  message: 'Please verify your email before creating listings'
}
```

**Why Email Verification Matters:**
- Ensures contact information is accurate
- Reduces spam and fake listings
- Required for communication with guests
- Improves platform trust and safety

**Flow:**
```javascript
exports.requireEmailVerification = (req, res, next) => {
  // User must be authenticated first
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  // Check email verification status
  if (!req.user.isEmailVerified) {
    return res.status(403).json({
      message: 'Please verify your email before proceeding'
    });
  }
  
  next();
};
```

**Protected Routes:**
- Creating listings (hosts)
- Creating reservations (guests)
- Managing payments

---

### `multer.middleware.js`
Handles file uploads, particularly image uploads to Cloudinary.

**Configuration:**

#### File Upload Limits
- Maximum files per request: 5 files
- Allowed formats: PNG, JPG, JPEG
- Size limit: Cloudinary defaults (typically 100MB)

**How it works:**
1. Receives multipart form-data requests
2. Uses Cloudinary storage configuration
3. Uploads files directly to Cloudinary
4. Returns URLs and filenames to request
5. Attaches file metadata to `req.files`

**Usage in Routes:**
```javascript
// Single file upload
router.post('/upload', upload.single('image'), handler);

// Multiple files (up to 5)
router.post('/upload-multiple', upload.array('images', 5), handler);

// Common example
router.post('/listings', 
  isLoggedIn, 
  requireEmailVerification,
  upload.array('images', 5),
  controller.createListing
);
```

**Request Structure:**
```
POST /api/listings
Content-Type: multipart/form-data

Form Data:
  title: "Beautiful Apartment"
  description: "..."
  images: [file1.jpg, file2.jpg, file3.jpg]
  ...
```

**Response - File Metadata:**
```javascript
req.files = [
  {
    fieldname: 'images',
    originalname: 'photo1.jpg',
    encoding: '7bit',
    mimetype: 'image/jpeg',
    size: 1024000,
    destination: 'folder/',
    filename: '1234_photo1.jpg',
    path: 'folder/1234_photo1.jpg',
    url: 'https://res.cloudinary.com/..../image/upload/...jpg' // Cloudinary URL
  }
]
```

**Error Handling:**
```javascript
// In controller, validate files
if (!req.files || req.files.length === 0) {
  return res.status(400).json({ message: 'At least one image required' });
}

// Save file URLs to database
const images = req.files.map(file => ({
  url: file.url,
  filename: file.filename
}));
```

**Configuration Details:**
```javascript
const upload = multer({ 
  storage: cloudinaryStorage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB per file
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/png', 'image/jpeg', 'image/jpg'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

module.exports = {
  single: (fieldname) => upload.single(fieldname),
  array: (fieldname, limit) => upload.array(fieldname, limit)
};
```

---

## 🔄 Middleware Chain Example

Route with multiple middleware:

```javascript
router.post(
  '/api/listings',
  
  // 1. Authentication check
  isLoggedIn,
  
  // 2. Email verification check
  requireEmailVerification,
  
  // 3. File upload handling
  upload.array('images', 5),
  
  // 4. Controller action
  listingController.createListing
);
```

**Request Flow:**
```
User sends request
    ↓
isLoggedIn middleware
    ↓ (if authentication passes)
requireEmailVerification middleware
    ↓ (if email verified)
multer upload middleware
    ↓ (if files valid)
listingController.createListing
    ↓
Response sent back
```

---

## 🔐 Security Features

### Authentication Security
- JWT tokens for stateless authentication
- Token expiration (optional)
- Secret key from environment
- Bearer token format prevents exposure

### File Upload Security
- File type validation (MIME type check)
- File size limits
- Cloudinary secure upload
- Filename sanitization

### Authorization
- Middleware checks permissions before controller
- User ID comparison for ownership
- Role-based checks possible

---

## 🌍 CORS Handling

CORS middleware is in main `app.js`:

```javascript
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://air-lite.vercel.app'
  ],
  credentials: true
}));
```

Allows frontend origins to make requests.

---

## ⚠️ Error Handling

Middleware should pass errors to Express error handler:

```javascript
// In middleware
try {
  jwt.verify(token, secret);
} catch (err) {
  // Option 1: Direct response
  return res.status(401).json({ message: 'Invalid token' });
  
  // Option 2: Pass to error middleware
  // next(err);
}
```

---

## 📊 Middleware Order in app.js

Order matters! Especially for webhook routes:

```javascript
// 1. Parse incoming request bodies
app.use(express.json());

// 2. Webhook MUST be before express.json() to get raw body
app.use('/api/webhooks', express.raw({ type: 'application/json' }), webhookRoutes);

// 3. CORS handling
app.use(cors(...));

// 4. Session and authentication
app.use(session(...));
app.use(passport.initialize());

// 5. Static files
app.use(express.static('public'));

// 6. API routes (with their own middleware)
app.use('/api/listings', listingRoutes);
app.use('/api/users', userRoutes);

// 7. Error handling (last)
app.use((err, req, res, next) => {
  // Error handler
});
```

---

## 🧪 Testing Middleware

Mock middleware for testing:

```javascript
const mockReq = {
  user: { id: '123', email: 'test@example.com' },
  headers: { authorization: 'Bearer token123' },
  files: [{ url: 'https://example.com/image.jpg' }]
};

const mockRes = {
  status: jest.fn().mockReturnThis(),
  json: jest.fn()
};

const mockNext = jest.fn();

// Test middleware
isLoggedIn(mockReq, mockRes, mockNext);
expect(mockNext).toHaveBeenCalled();
```

---

## 🔗 Related Files

- [../app.js](../app.js) - Where middleware is registered
- [../config/cloudinary.js](../config/cloudinary.js) - Cloudinary storage config
- [../utils/ExpressError.util.js](../utils/ExpressError.util.js) - Error handling
- [../controllers/](../controllers/) - Handlers after middleware

---

## 📚 Creating Custom Middleware

Template for new middleware:

```javascript
/**
 * Middleware description
 */
exports.middlewareName = (req, res, next) => {
  try {
    // 1. Get data from request
    // 2. Validate/check conditions
    // 3. Either allow (next()) or deny (res.status(...))
    
    if (conditionMet) {
      next(); // Pass to next middleware/handler
    } else {
      return res.status(403).json({ message: 'Denied' });
    }
  } catch (err) {
    next(err); // Pass error to error handler
  }
};
```

---

## 📚 Resources

- [Express Middleware Guide](https://expressjs.com/en/guide/using-middleware.html)
- [JWT Documentation](https://jwt.io)
- [Multer Documentation](https://expressjs.com/en/resources/middleware/multer.html)
- [Cloudinary Node SDK](https://cloudinary.com/documentation/node_integration)

