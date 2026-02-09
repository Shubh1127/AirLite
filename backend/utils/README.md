# Backend Utils Directory

The `utils/` directory contains utility functions and helper modules that provide reusable functionality across the application, including email handling, error management, refund processing, and scheduling.

## 📋 Overview

Utility modules provide:
- Email template generation and sending
- Custom error handling
- Refund calculation and processing
- Scheduled task execution
- Async function wrapping
- Express error utilities

Each utility is focused on a single responsibility and can be imported by multiple controllers.

## 📁 Files

### `mail.util.js`
Centralizes all email sending functionality with retry logic.

**Core Function: `sendEmail(options, retries = 3)`**

Sends emails with automatic retry on failure.

**Parameters:**
```javascript
const options = {
  to: 'recipient@example.com',      // Recipient email
  subject: 'Email Subject',          // Email subject line
  html: '<h1>HTML content</h1>',     // HTML template
  text: 'Plain text version',        // Optional plain text fallback
  cc: 'cc@example.com',              // Optional CC recipients
  bcc: 'bcc@example.com',            // Optional BCC recipients
  attachments: [                      // Optional attachments
    {
      filename: 'document.pdf',
      path: '/path/to/file'
    }
  ]
};

const retries = 3; // Number of retry attempts on failure
```

**Returns:**
```javascript
{
  messageId: 'unique-id',
  response: 'Mail server response',
  accepted: ['recipient@example.com']
}
```

**How Retry Logic Works:**
1. Attempts initial send
2. On failure, waits and retries
3. Retries up to 3 times (configurable)
4. Throws error if all attempts fail
5. Logs detailed error information

**Usage Example:**
```javascript
const { sendEmail } = require('../utils/mail.util');

await sendEmail({
  to: user.email,
  subject: 'Welcome to AirLite',
  html: '<h1>Welcome!</h1><p>Thanks for signing up</p>'
});
```

---

**Email Sending Functions:**

#### `sendSignupEmail(email, username)`
Sends welcome email after user registration.

**Template:** Uses `signupTemplate` from emailTemplates.js
**Variables:** username, signup date
**Example:**
```javascript
await sendSignupEmail('user@example.com', 'john_doe');
```

---

#### `sendVerifyEmailEmail(email, verificationLink)`
Sends email with verification link.

**Template:** Uses `verifyEmailTemplate`
**Variables:** Verification link, expiration time
**Example:**
```javascript
const link = `${process.env.FRONTEND_URL}/verify?token=${token}`;
await sendVerifyEmailEmail('user@example.com', link);
```

---

#### `sendListingCreatedEmail(email, listingTitle)`
Notifies host when listing is created.

**Template:** Uses `listingCreatedTemplate`
**Variables:** Listing title, URL to edit
**Triggered:** After successful listing creation
**Example:**
```javascript
await sendListingCreatedEmail(host.email, 'Beautiful Beach House');
```

---

#### `sendReservationEmail(email, reservationDetails)`
Sends booking confirmation to guest.

**Template:** Uses `reservationTemplate`
**Variables:** Guest name, property details, dates, price
**Example:**
```javascript
await sendReservationEmail(guest.email, {
  propertyName: 'Ocean View Apartment',
  checkIn: '2025-03-01',
  checkOut: '2025-03-07',
  totalPrice: 5000
});
```

---

#### `sendPaymentSuccessEmail(email, transactionDetails)`
Notifies user of successful payment.

**Template:** Uses `paymentSuccessTemplate`
**Variables:** Amount, date, transaction ID, receipt link
**Example:**
```javascript
await sendPaymentSuccessEmail(email, {
  amount: 5000,
  transactionId: 'TXN_123456',
  date: new Date()
});
```

---

#### `sendRefundEmail(email, refundDetails)`
Notifies about refund status.

**Templates:** 
- `refundInitiatedTemplate` - Refund started
- `refundSuccessfulTemplate` - Refund completed
- `refundFailedTemplate` - Refund rejected

**Variants:**
```javascript
// Refund initiated
await sendRefundEmail(email, { status: 'initiated', amount: 1000 });

// Refund successful
await sendRefundEmail(email, { status: 'successful', amount: 1000 });

// Refund failed
await sendRefundEmail(email, { status: 'failed', reason: 'Invalid bank account' });
```

---

### `emailTemplates.js`
Contains HTML email templates for all system emails.

**Available Templates:**

#### `signupTemplate(userName)`
Welcome email for new users.
- Greeting with username
- Account information
- Next steps
- Call to action

#### `verifyEmailTemplate(verificationLink, expirationTime)`
Email verification request.
- Explanation of verification
- Verification button/link
- Link expiration time
- Support contact

#### `loginTemplate(userName)`
Login confirmation (optional).
- Login confirmation
- Account security info
- Change password link

#### `listingCreatedTemplate(listingTitle, editLink)`
Listing creation confirmation.
- Celebration message
- Listing preview
- Edit and manage links
- Next steps (set availability, pricing)

#### `reservationTemplate(guestName, propertyDetails, dates, totalPrice)`
Booking confirmation for host and guest.
- Reservation details
- Guest/Host information
- Check-in/check-out instructions
- Contact information
- Cancel/modify links

#### `paymentSuccessTemplate(amount, transactionId, date)`
Payment receipt.
- Amount paid
- Transaction ID
- Payment method
- Receipt date
- Download receipt link

#### `reservationCancelledTemplate(reason, refundAmount)`
Reservation cancellation notice.
- Cancellation confirmation
- Reason for cancellation
- Refund information
- Policy details

#### `refundInitiatedTemplate(amount, estimatedDate)`
Refund process started.
- Refund confirmation
- Amount and timeline
- Tracking information
- Support contact

#### `refundSuccessfulTemplate(amount, date, bankAccount)`
Refund completed.
- Successful refund confirmation
- Amount and date
- Bank account last 4 digits
- Receipt link

#### `refundFailedTemplate(reason, nextSteps)`
Refund failed or rejected.
- Failure explanation
- Reason for failure
- Next steps to resolve
- Support contact

#### `reservationDetailsTemplate(reservation)`
Detailed reservation information document.
- All reservation details
- Guest and host info
- Property details
- Payment breakdown
- Terms and conditions

---

### `refund.util.js`
Handles refund calculations and processing logic.

**Functions:**

#### `calculateRefundAmount(reservation, cancellationPolicy)`
Calculates refund based on cancellation policy.

**Parameters:**
```javascript
{
  totalPrice: 5000,
  daysUntilCheckIn: 20,
  cancellationPolicy: 'flexible' // 'flexible', 'moderate', 'strict'
}
```

**Refund Rules:**
- **Flexible:** 
  - Full refund if 7+ days before
  - 50% refund if 3-6 days before
  - No refund if <3 days

- **Moderate:**
  - 50% refund if 14+ days before
  - No refund if <14 days

- **Strict:**
  - No refund (non-refundable)

**Returns:**
```javascript
{
  refundAmount: 5000,
  refundPercentage: 100,
  reason: 'Full refund - 20 days before checkout'
}
```

**Example:**
```javascript
const refund = calculateRefundAmount(reservation, 'flexible');
console.log(refund); // { refundAmount: 5000, refundPercentage: 100 }
```

---

#### `processRefund(reservation, paymentMethod = 'razorpay')`
Initiates refund via payment gateway.

**Parameters:**
- `reservation` - Reservation object with paymentId
- `paymentMethod` - 'razorpay' or 'stripe'

**Returns:**
```javascript
{
  success: Boolean,
  refundId: String,
  amount: Number,
  status: String,
  estimatedDate: Date
}
```

**Error Handling:**
- Validates reservation exists
- Checks if payment was successful
- Handles API errors gracefully

**Example:**
```javascript
const result = await processRefund(reservation, 'razorpay');
if (result.success) {
  console.log('Refund initiated:', result.refundId);
}
```

---

#### `trackRefund(refundId, paymentMethod = 'razorpay')`
Checks refund status with payment provider.

**Returns:**
```javascript
{
  refundId: String,
  status: 'initiated' | 'processing' | 'successful' | 'failed',
  amount: Number,
  createdAt: Date,
  completedAt: Date,
  failureReason: String // if failed
}
```

**Status Timeline:**
1. `initiated` - Refund requested
2. `processing` - Refund in progress
3. `successful` - Money returned to customer
4. `failed` - Refund rejected

**Example:**
```javascript
const status = await trackRefund('RFD_123456');
console.log(status.status); // 'successful'
```

---

See [../REFUND_SETUP_GUIDE.md](../REFUND_SETUP_GUIDE.md) for refund setup and monitoring.

---

### `ExpressError.util.js`
Custom error class for consistent error handling.

**Class: `ExpressError`**

```javascript
class ExpressError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.message = message;
  }
}
```

**Usage:**
```javascript
const ExpressError = require('../utils/ExpressError.util');

// Simple error
throw new ExpressError('Not found', 404);

// In middleware
if (!user) throw new ExpressError('User not found', 404);

// Error handling in catch block
try {
  await process.operation();
} catch (err) {
  throw new ExpressError('Operation failed', 500);
}
```

**HTTP Status Code Reference:**
- `400` - Bad Request (invalid input)
- `401` - Unauthorized (not authenticated)
- `403` - Forbidden (authenticated but not allowed)
- `404` - Not Found (resource doesn't exist)
- `409` - Conflict (duplicate data)
- `422` - Unprocessable Entity (validation error)
- `500` - Internal Server Error

**Error Middleware:**
```javascript
app.use((err, req, res, next) => {
  const { statusCode = 500, message } = err;
  
  res.status(statusCode).json({
    error: {
      message,
      status: statusCode
    }
  });
});
```

---

### `scheduler.util.js`
Handles scheduled background tasks using node-cron.

**Functions:**

#### `initializeScheduler()`
Sets up all scheduled tasks.

**Scheduled Tasks:**

1. **Email Reminder Emails (Daily at 9 AM)**
   - Sends checkout reminders 24 hours before
   - Sends host notifications of new reservations
   - Frequency: Once daily

2. **Listing Verification (Every 7 days)**
   - Checks listing accuracy
   - Updates availability status
   - Frequency: Weekly

3. **Refund Auto-completion (Daily)**
   - Checks refund status with payment providers
   - Marks completed refunds
   - Sends notifications
   - Frequency: Every 6 hours

4. **Cleanup (Weekly)**
   - Removes expired verification tokens
   - Archives old records
   - Frequency: Sunday midnight

**Example:**
```javascript
const { initializeScheduler } = require('../utils/scheduler.util');

// In app.js startup
initializeScheduler(); // Starts all scheduled tasks
```

**Cron Patterns:**
```
'0 9 * * *'   → Daily at 9:00 AM
'0 */6 * * *' → Every 6 hours
'0 0 * * 0'   → Monday at midnight
```

---

### `wrapAsync.util.js`
Wraps async route handlers to catch errors automatically.

**Function: `wrapAsync(fn)`**

**Purpose:** Eliminates repetitive try-catch blocks in route handlers.

**Before (without wrapper):**
```javascript
router.get('/', async (req, res, next) => {
  try {
    const listings = await Listing.find();
    res.json(listings);
  } catch (err) {
    next(err); // Manual error passing
  }
});
```

**After (with wrapper):**
```javascript
router.get('/', wrapAsync(async (req, res) => {
  const listings = await Listing.find();
  res.json(listings);
  // Errors automatically caught and passed to next(err)
}));
```

**Implementation:**
```javascript
const wrapAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};
```

**Benefits:**
- DRYer code (less try-catch boilerplate)
- Consistent error handling
- Cleaner route definitions
- Automatic error middleware routing

**Usage in Controllers:**
```javascript
const wrapAsync = require('../utils/wrapAsync.util');

module.exports.getListings = wrapAsync(async (req, res) => {
  // No try-catch needed - errors auto-caught
  const listings = await Listing.find();
  res.json({ success: true, data: listings });
});
```

---

## 🔗 Import Examples

**In Controllers:**
```javascript
const { sendListingCreatedEmail } = require('../utils/mail.util');
const { calculateRefundAmount } = require('../utils/refund.util');
const ExpressError = require('../utils/ExpressError.util');
const wrapAsync = require('../utils/wrapAsync.util');
```

**In Routes:**
```javascript
const wrapAsync = require('../utils/wrapAsync.util');

router.get('/', wrapAsync(controller.getAll));
```

---

## 📊 Email Flow Diagram

```
User Action
  ↓
Controller Function
  ↓
sendXXXEmail() call
  ↓
mail.util.js
  ↓
emailTemplates.js (get template)
  ↓
mail.config.js (create transporter)
  ↓
Nodemailer/SendGrid (send)
  ↓
Retry logic if failed
  ↓
Success/Error response
```

---

## 🔐 Sensitive Data Handling

**Email Content:**
- Never include passwords
- Never include payment tokens
- Include secure links with expiration
- Use placeholder data when testing

**Refund Information:**
- Mask bank account numbers
- Show last 4 digits only
- Keep refund IDs secret
- Log errors but not sensitive data

---

## 🧪 Testing Utils

**Mock sendEmail:**
```javascript
jest.mock('../utils/mail.util', () => ({
  sendEmail: jest.fn().mockResolvedValue({
    messageId: 'test-123'
  })
}));
```

**Mock calculateRefund:**
```javascript
const { calculateRefundAmount } = require('../utils/refund.util');
const refund = calculateRefundAmount(reservation, 'flexible');
expect(refund.refundPercentage).toBe(100);
```

---

## 📈 Performance Considerations

**Email Sending:**
- Async operations don't block request
- Retry mechanism handles temporary failures
- Queue system (optional) for high volume

**Refund Processing:**
- Background scheduler handles processing
- API calls to payment providers
- Caching refund status reduces calls

**Scheduled Tasks:**
- Non-blocking background processes
- Configurable intervals
- Error logging for failures

---

## 🔗 Related Files

- [../controllers/](../controllers/) - Uses mail and refund utils
- [../config/mail.config.js](../config/mail.config.js) - Email configuration
- [../routes/](../routes/) - Uses wrapAsync for handlers
- [../REFUND_SETUP_GUIDE.md](../REFUND_SETUP_GUIDE.md) - Refund documentation
- [../REFUND_MONITORING.md](../REFUND_MONITORING.md) - Monitoring refunds

---

## 📚 Resources

- [Nodemailer Documentation](https://nodemailer.com/)
- [SendGrid Documentation](https://docs.sendgrid.com/)
- [node-cron Documentation](https://github.com/kelektiv/node-cron)
- [Express Error Handling](https://expressjs.com/en/guide/error-handling.html)

