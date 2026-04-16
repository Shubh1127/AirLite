# Refund Status Check Implementation Summary

## What Was Created

I've implemented a comprehensive refund status management system that automatically checks and updates pending refunds from Razorpay. 

### ✅ Core Features

1. **Automatic Periodic Checks**
   - Runs every 30 minutes automatically
   - No manual intervention needed
   - Checks all reservations with pending/initiated refund status

2. **Manual Refund Checks**
   - Check specific reservation refund status on-demand
   - Manually trigger full refund status check for all pending refunds
   - Get real-time statistics about pending refunds

3. **Database Synchronization**
   - Updates reservation status based on Razorpay status
   - Maintains consistency between your database and Razorpay
   - Tracks: `refundStatus`, `refundedAt`, reservation `status`

4. **Email Notifications**
   - Sends "Refund Successful" email when processed
   - Sends "Refund Failed" email if processing fails
   - Includes refund details in emails

## Files Created/Modified

### New Files Created

| File | Purpose |
|------|---------|
| `backend/utils/refund.util.js` | Core refund checking logic |
| `backend/utils/scheduler.util.js` | Cron job management for automatic checks |
| `REFUND_STATUS_MANAGEMENT.md` | Complete technical documentation |
| `REFUND_SETUP_GUIDE.md` | Quick setup and usage guide |

### Files Modified

| File | Changes |
|------|---------|
| `backend/controllers/payment.controller.js` | Added 3 new endpoint handlers + import refund utilities |
| `backend/routes/payment.route.js` | Added 3 new API routes |
| `backend/app.js` | Import and initialize scheduler on app startup |
| `backend/package.json` | Added `node-cron` dependency |

## New API Endpoints

All endpoints require authentication (`isLoggedIn` middleware)

### 1. Update All Pending Refunds
**POST** `/api/payments/update-pending-refunds`

Manually trigger a complete check of all pending refunds

```bash
curl -X POST http://localhost:8080/api/payments/update-pending-refunds \
  -H "Authorization: Bearer TOKEN"
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
    "updatedReservations": [...]
  }
}
```

### 2. Get Pending Refunds Statistics
**GET** `/api/payments/pending-refunds-stats`

Get aggregated statistics about pending refunds

```bash
curl -X GET http://localhost:8080/api/payments/pending-refunds-stats \
  -H "Authorization: Bearer TOKEN"
```

**Response:**
```json
{
  "message": "Pending refunds statistics",
  "data": {
    "byStatus": [
      {"_id": "initiated", "count": 3, "totalAmount": 15000},
      {"_id": "pending", "count": 2, "totalAmount": 8000}
    ],
    "timestamp": "2026-02-07T10:30:00Z"
  }
}
```

### 3. Check Specific Refund
**POST** `/api/payments/check-refund/:reservationId`

Check and update a specific reservation's refund status

```bash
curl -X POST http://localhost:8080/api/payments/check-refund/507f1f77bcf86cd799439011 \
  -H "Authorization: Bearer TOKEN"
```

## Automatic Scheduling

### Schedule Details

- **Frequency:** Every 30 minutes
- **Start Time:** On minute :00 and :30 (automatic)
- **Cron Expression:** `0 */30 * * * *`
- **Example Times:** 12:00, 12:30, 13:00, 13:30, etc.

### Automatic Behavior

When scheduler runs:
1. ✅ Query database for pending/initiated refunds
2. ✅ Fetch current status from Razorpay API
3. ✅ Update database if status changed
4. ✅ Send email notifications if needed
5. ✅ Log detailed results

No configuration needed - starts automatically when server starts!

## How It Works - Refund Status Flow

```
┌─────────────────────────────────────┐
│      User Cancels Reservation       │
└────────────────┬────────────────────┘
                 │
    ┌────────────▼────────────┐
    │  Calculate Refund Amount │
    └────────────┬────────────┘
                 │
         ┌───────▼──────────┐
         │ No Refund Needed?│◄──Yes──► Status: 'cancelled'
         └────────┬─────────┘          refundStatus: 'none'
                  │
                  No
                  │
         ┌────────▼──────────┐
         │ Initiate Refund    │
         │ in Razorpay        │
         └────────┬──────────┘
                  │
         ┌────────▼────────────────┐
         │ Status: 'refund-pending'│
         │ refundStatus: 'initiated'
         │ Store: refundTransactionId
         └────────┬────────────────┘
                  │
         ┌────────▼────────────────────────┐
         │ Automatic Check (every 30 mins)  │
         └────────┬───────────────────────┘
                  │
    ┌─────────────┼─────────────┐
    │             │             │
Processed    Failed        Pending
    │             │             │
    ▼             ▼             ▼
refunded    cancelled    (no change)
(Status OK) (Status OK)  (Check again later)
```

## Dependencies

The system requires:

```json
{
  "node-cron": "^3.0.3",
  "@sendgrid/mail": "^8.1.6",
  "razorpay": "^2.8.2"
}
```

All are already in `backend/package.json`

## Environment Variables Required

```env
# Razorpay credentials
RAZORPAY_KEY_ID=<your-razorpay-key-id>
RAZORPAY_KEY_SECRET=<your-razorpay-key-secret>
RAZORPAY_WEBHOOK_SECRET=<your-razorpay-webhook-secret>

# Email service
SENDGRID_API_KEY=<your-sendgrid-api-key>
SENDGRID_FROM_EMAIL=verified@example.com
```

## Database Fields Used

### Reservation Model
- `refundStatus` - Current refund status (pending/initiated/completed/failed)
- `refundTransactionId` - Razorpay refund ID
- `refundAmount` - Amount being refunded
- `refundedAt` - When refund completed
- `status` - Reservation status (includes 'refund-pending', 'refunded')

### Cancellation Model
- `refundStatus` - Refund processing status
- `razorpayRefundId` - Razorpay refund ID
- `refundInitiatedAt` - When refund was initiated
- `refundCompletedAt` - When refund completed

## Logging Example

During automatic check, you'll see:

```
============================================================
🔄 CHECKING PENDING REFUNDS FROM RAZORPAY
============================================================
📊 Found 3 reservations with pending refunds

🔍 Manually checking refund for: rfnd_1234567890
   Razorpay Status: processed
   Amount: ₹5000
   ✅ Refund SUCCEEDED
   📝 Updating status: refund-pending → refunded
   📧 Sending refund success email to guest@example.com

🔍 Checking refund for: rfnd_0987654321
   Razorpay Status: failed
   Amount: ₹3000
   ❌ Refund FAILED
   📝 Updating status: refund-pending → cancelled
   📧 Sending refund failed email to guest@example.com

============================================================
📈 REFUND CHECK SUMMARY
============================================================
✅ Updated: 2
ℹ️  Unchanged: 1
❌ Errors: 0
📊 Total Checked: 3
============================================================
```

## Testing the System

### Step 1: Generate a Refund
1. Make a booking
2. Cancel it (refund applicable based on cancellation policy)
3. Wait for refund to be initiated

### Step 2: Check Manually
```bash
curl -X GET http://localhost:8080/api/payments/pending-refunds-stats
```

### Step 3: Wait for Automatic Check
- Check runs automatically every 30 minutes
- Or manually trigger: `POST /api/payments/update-pending-refunds`

### Step 4: Verify Update
```bash
# Get stats again - should show fewer pending refunds
curl -X GET http://localhost:8080/api/payments/pending-refunds-stats

# Check specific reservation
curl -X POST http://localhost:8080/api/payments/check-refund/RESERVATION_ID
```

## Production Deployment

### For Render.com

1. **Install dependency:**
   ```bash
   npm install node-cron
   ```

2. **Push to git:**
   ```bash
   git add .
   git commit -m "Add refund status checking system with automatic scheduler"
   git push
   ```

3. **Set environment variables in Render dashboard:**
   - All the `.env` variables

4. **Render auto-deploys** and scheduler starts automatically ✅

### Monitoring

- Check Render logs for automatic check logs every 30 minutes
- Monitor via API endpoints: `pending-refunds-stats`
- Review SendGrid dashboard for email delivery

## Customization

### Change Check Frequency

Edit `backend/utils/scheduler.util.js` line with `cron.schedule()`:

```javascript
// Change from every 30 minutes to every 1 hour:
scheduledTasks.refundCheck = cron.schedule('0 * * * * *', async () => {
  // daily at 3 AM: '0 0 3 * * *'
  // every 15 minutes: '0 */15 * * * *'
});
```

### Add More Scheduled Tasks

Add to `scheduler.util.js` `initializeScheduler()` function:

```javascript
scheduledTasks.myTask = cron.schedule('0 * * * * *', async () => {
  console.log('My task running...');
  // Your code here
});
```

## API Usage Examples (Frontend)

### React Component Example

```typescript
// Get refund stats
const fetchRefundStats = async (token: string) => {
  const res = await fetch('/api/payments/pending-refunds-stats', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return res.json();
};

// Manually check refunds
const checkAllRefunds = async (token: string) => {
  const res = await fetch('/api/payments/update-pending-refunds', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return res.json();
};

// Check specific reservation
const checkReservationRefund = async (reservationId: string, token: string) => {
  const res = await fetch(`/api/payments/check-refund/${reservationId}`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return res.json();
};
```

## Troubleshooting Checklist

- [ ] `node-cron` installed: `npm list node-cron`
- [ ] `.env` has Razorpay keys
- [ ] `.env` has SendGrid API key and verified email
- [ ] Server starts without errors
- [ ] Scheduler message appears in logs
- [ ] Logs appear every 30 minutes
- [ ] Test refund generates a refundTransactionId

## Documentation Files

- **[REFUND_STATUS_MANAGEMENT.md](./REFUND_STATUS_MANAGEMENT.md)** - Complete technical documentation
- **[REFUND_SETUP_GUIDE.md](./REFUND_SETUP_GUIDE.md)** - Quick start guide

## Summary

✅ **Fully automated refund status checking system**
- No more manual refund tracking
- Automatic updates every 30 minutes
- Manual endpoints for on-demand checks
- Email notifications for guests
- Comprehensive logging for monitoring
- Production-ready and scalable

**Ready to deploy!** 🚀
