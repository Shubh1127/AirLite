# Refund Status Management System

## Overview

This system automatically checks and updates pending refund statuses from Razorpay. It includes:

1. **Automatic periodic checks** via cron jobs (every 30 minutes)
2. **Manual refund status checks** for specific reservations
3. **Refund statistics** and monitoring
4. **Email notifications** when refunds are processed or fail

## Setup

### Prerequisites

Make sure you have the `node-cron` package installed:

```bash
npm install --save node-cron
```

If not already installed, add it to `backend/package.json`:

```bash
cd backend
npm install node-cron
```

### Environment Variables

Ensure these are set in your `.env` file:

```
RAZORPAY_KEY_ID=<your-razorpay-key-id>
RAZORPAY_KEY_SECRET=<your-razorpay-key-secret>
RAZORPAY_WEBHOOK_SECRET=<your-razorpay-webhook-secret>
SENDGRID_API_KEY=<your-sendgrid-api-key>
SENDGRID_FROM_EMAIL=verified_email@yourdomain.com
```

## Components

### 1. **Refund Utility** (`backend/utils/refund.util.js`)

Core functions for refund management:

#### `updateAllPendingRefunds()`
- Fetches all reservations with `refundStatus: 'pending'` or `'initiated'`
- Queries Razorpay for each refund's current status
- Updates database and sends email notifications
- Returns summary of updates

#### `getPendingRefundStats()`
- Returns aggregated statistics of pending refunds
- Groups by refund status
- Shows total count and amount by status

#### `checkSpecificRefund(reservationId)`
- Manually check one reservation's refund status
- Updates database if status changed
- Sends email notification if needed

### 2. **Payment Controller Updates** (`backend/controllers/payment.controller.js`)

New endpoints:

#### `updatePendingRefunds()` - POST
Manually trigger a full refund status check for all pending refunds

#### `getPendingRefundsStats()` - GET
Get statistics about pending refunds

#### `checkSpecificRefundStatus()` - POST
Check and update a specific reservation's refund status

### 3. **Scheduler** (`backend/utils/scheduler.util.js`)

Manages background cron jobs:

#### `initializeScheduler()`
Starts all scheduled tasks (called automatically on app startup)

#### `stopScheduler()`
Stops all scheduled tasks gracefully

#### `triggerRefundCheck()`
Manually trigger a refund check outside the schedule

#### `rescheduleTask(taskName, cronExpression)`
Change the frequency of a scheduled task

### 4. **Routes** (`backend/routes/payment.route.js`)

**Refund Management Routes:**

```
POST   /api/payments/update-pending-refunds
  - Manually trigger all pending refund checks
  - Expected response: { message, summary: { total, updated, unchanged, errors, updatedReservations } }

GET    /api/payments/pending-refunds-stats
  - Get statistics about pending refunds
  - Expected response: { message, data: { byStatus, timestamp } }

POST   /api/payments/check-refund/:reservationId
  - Manually check specific reservation's refund status
  - Expected response: { message, reservation: {...} }
```

## API Usage

### 1. Update All Pending Refunds

```bash
curl -X POST http://localhost:8080/api/payments/update-pending-refunds \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "message": "Pending refunds checked and updated",
  "summary": {
    "total": 5,
    "updated": 2,
    "unchanged": 3,
    "errors": 0,
    "updatedReservations": [
      {
        "reservationId": "507f1f77bcf86cd799439011",
        "oldStatus": "refund-pending",
        "newStatus": "refunded",
        "refundAmount": 5000,
        "guestEmail": "guest@example.com"
      }
    ]
  }
}
```

### 2. Get Refund Statistics

```bash
curl -X GET http://localhost:8080/api/payments/pending-refunds-stats \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "message": "Pending refunds statistics",
  "data": {
    "byStatus": [
      {
        "_id": "initiated",
        "count": 3,
        "totalAmount": 15000
      },
      {
        "_id": "pending",
        "count": 2,
        "totalAmount": 8000
      }
    ],
    "timestamp": "2026-02-07T10:30:00.000Z"
  }
}
```

### 3. Check Specific Refund

```bash
curl -X POST http://localhost:8080/api/payments/check-refund/507f1f77bcf86cd799439011 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Automatic Scheduling

### Default Schedule

```
Every 30 minutes at :00 and :30 of every hour
Cron Expression: 0 */30 * * * *
```

Example run times:
- 00:00, 00:30
- 01:00, 01:30
- ... and so on

### Changing Schedule

To modify the refund check frequency, update `backend/utils/scheduler.util.js`:

```javascript
// Current: every 30 minutes
scheduledTasks.refundCheck = cron.schedule('0 */30 * * * *', async () => {
  // ...
});

// Change to every 15 minutes: '0 */15 * * * *'
// Change to every hour: '0 * * * * *'
// Change to 3 AM daily: '0 0 3 * * *'
```

**Cron Expression Format:**
```
Second Minute Hour Day-of-Month Month Day-of-Week
```

Common examples:
- `0 */ 30 * * * *` - Every 30 minutes
- `0 * * * * *` - Every minute
- `0 0 * * * *` - Every hour, on the hour
- `0 0 9 * * *` - Every day at 9:00 AM
- `0 0 0 * * 0` - Every Sunday at midnight

## Database Schema Updates

### Reservation Model Fields

The system uses these fields:

```javascript
refundStatus: {
  type: String,
  enum: ['none', 'pending', 'initiated', 'completed', 'failed'],
  default: 'none',
}

refundTransactionId: {
  type: String,
  // Stores Razorpay refund ID
}

refundAmount: {
  type: Number,
  default: 0,
}

refundedAt: {
  type: Date,
  // When refund was completed
}

status: {
  type: String,
  enum: ['pending', 'confirmed', 'cancelled', 'completed', 'refund-pending', 'refunded'],
  default: 'pending',
}
```

### Cancellation Model Fields

```javascript
refundStatus: {
  type: String,
  enum: ['none', 'pending', 'processing', 'initiated', 'completed', 'failed'],
  default: 'pending',
}

razorpayRefundId: {
  type: String,
}

refundInitiatedAt: {
  type: Date,
}

refundCompletedAt: {
  type: Date,
}
```

## Refund Status Flow

```
1. Cancellation Initiated
   ↓
   ├─ No refund → status: 'cancelled', refundStatus: 'none'
   └─ Has refund → status: 'refund-pending', refundStatus: 'pending'
   
2. Refund Initiated to Razorpay
   → refundTransactionId stored
   → refundStatus: 'initiated'
   
3. Periodic Check or Manual Request
   ↓
   ├─ Razorpay shows 'processed' → status: 'refunded', refundStatus: 'completed'
   ├─ Razorpay shows 'failed' → status: 'cancelled', refundStatus: 'failed'
   └─ Razorpay shows 'pending' → No change, retry later
   
4. Email Sent
   ├─ If refund succeeded: sendRefundSuccessfulEmail()
   └─ If refund failed: sendRefundFailedEmail()
```

## Logging and Monitoring

All operations are logged with emoji indicators:

- 🔄 Starting periodic/manual check
- 🔍 Fetching refund details
- ✅ Refund succeeded
- ❌ Refund failed
- ⏳ Refund still pending
- 📝 Status updated
- 📧 Email sent
- ⚠️ Warning or issue

### Example Log Output

```
=======================================
🔍 Fetching refund status for: rfnd_1234567890
   Razorpay Status: processed
   Amount: ₹5000
   ✅ Refund SUCCEEDED
   📝 Updating status: refund-pending → refunded
   📧 Sending refund success email to guest@example.com
```

## Error Handling

The system handles various error scenarios:

1. **Missing refund transaction ID**
   - Skips the reservation
   - Logs warning

2. **Razorpay API errors**
   - Catches and logs error
   - Continues with next reservation
   - Doesn't update database

3. **Email sending failures**
   - Logs error
   - Doesn't block refund update
   - User can retry via manual check

## Testing

### Test Refund Update

```bash
# Check stats before
curl -X GET http://localhost:8080/api/payments/pending-refunds-stats \
  -H "Authorization: Bearer YOUR_TOKEN"

# Trigger update
curl -X POST http://localhost:8080/api/payments/update-pending-refunds \
  -H "Authorization: Bearer YOUR_TOKEN"

# Check stats after
curl -X GET http://localhost:8080/api/payments/pending-refunds-stats \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Test Specific Refund

```bash
# Create a reservation and cancel it first to get a refund ID
# Then test:
curl -X POST http://localhost:8080/api/payments/check-refund/YOUR_RESERVATION_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Troubleshooting

### Scheduler Not Running

Check if `node-cron` is installed:
```bash
npm list node-cron
```

If missing:
```bash
cd backend
npm install node-cron
```

### Refunds Not Updating

1. Check if refund has a `refundTransactionId`:
   ```bash
   curl -X GET http://localhost:8080/api/payments/pending-refunds-stats
   ```

2. Verify Razorpay credentials in `.env`

3. Check server logs for API errors

4. Manually trigger check:
   ```bash
   curl -X POST http://localhost:8080/api/payments/update-pending-refunds
   ```

### Email Not Sent

1. Verify SendGrid API key in `.env`
2. Check if email address is verified in SendGrid dashboard
3. Review server logs for email errors
4. Check spam folder

## Production Deployment

### On Render

1. Add `node-cron` to `package.json` dependencies
2. Ensure environment variables are set in Render dashboard
3. Push changes to git
4. Render will automatically restart with scheduler enabled

### Monitoring in Production

- Check refund stats regularly via API
- Set up error alerts for failed refunds
- Monitor email delivery via SendGrid dashboard
- Review logs in Render dashboard

## Future Enhancements

Potential improvements:

1. **Webhook acknowledgment** - Razorpay sends webhook after refund processed automatically
2. **Database indexes** - Add index on `refundStatus` and `refundTransactionId` for faster queries
3. **Bulk operations** - Batch multiple Razorpay API calls
4. **Configurable frequency** - Admin dashboard to change check frequency
5. **Retry logic** - Exponential backoff for failed checks
6. **Analytics** - Track refund processing times and success rates
7. **Admin dashboard** - UI to monitor and manage refunds

---

**Last Updated:** February 7, 2026
**Version:** 1.0
