# Refund Status Management - Quick Setup Guide

## Installation

### Step 1: Install Dependencies

If you haven't already installed `node-cron`, run:

```bash
cd backend
npm install node-cron
```

Or install all dependencies:

```bash
npm install
```

### Step 2: Verify Environment Variables

Ensure your `.env` file has:

```env
# Razorpay
RAZORPAY_KEY_ID=<your-razorpay-key-id>
RAZORPAY_KEY_SECRET=<your-razorpay-key-secret>
RAZORPAY_WEBHOOK_SECRET=<your-razorpay-webhook-secret>

# SendGrid (for refund emails)
SENDGRID_API_KEY=<your-sendgrid-api-key>
SENDGRID_FROM_EMAIL=verified_email@yourdomain.com
```

### Step 3: Start the Server

The scheduler will initialize automatically:

```bash
npm start
# or for development with auto-reload:
npm run dev
```

You should see in the logs:

```
🕐 Initializing scheduler for background tasks...
✅ Scheduler initialized
   📋 Refund Status Check: Every 30 minutes
   📋 Next runs at: :00 and :30 of every hour
```

## File Overview

### New/Modified Files

1. **backend/utils/refund.util.js** (NEW)
   - Core refund status checking logic
   - Functions: `updateAllPendingRefunds()`, `getPendingRefundStats()`, `checkSpecificRefund()`

2. **backend/utils/scheduler.util.js** (NEW)
   - Cron job management
   - Automatic periodic checks (every 30 minutes)

3. **backend/controllers/payment.controller.js** (MODIFIED)
   - Added 3 new endpoint controllers
   - Imported refund utilities

4. **backend/routes/payment.route.js** (MODIFIED)
   - Added 3 new API routes
   - Routes: update-pending-refunds, pending-refunds-stats, check-refund

5. **backend/app.js** (MODIFIED)
   - Import scheduler utility
   - Initialize scheduler on app startup

6. **backend/package.json** (MODIFIED)
   - Added `node-cron` dependency

7. **REFUND_STATUS_MANAGEMENT.md** (NEW)
   - Complete documentation

## Usage Examples

### Test Immediately

Once the server starts, test the system:

```bash
# 1. Get pending refunds statistics
curl -X GET http://localhost:8080/api/payments/pending-refunds-stats \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# 2. Manually trigger refund check
curl -X POST http://localhost:8080/api/payments/update-pending-refunds \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# 3. Check specific reservation's refund
curl -X POST http://localhost:8080/api/payments/check-refund/RESERVATION_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Automatic Checks

The system automatically checks pending refunds:
- **Frequency:** Every 30 minutes
- **Times:** At :00 and :30 of every hour (00:00, 00:30, 01:00, 01:30, etc.)
- **No action needed:** Fully automatic

### What Happens During a Check

1. ✅ Queries database for reservations with `refundStatus: 'pending'` or `'initiated'`
2. ✅ For each, fetches current status from Razorpay API
3. ✅ Updates database if status changed
4. ✅ Sends email notification to guest
5. ✅ Logs all results with detailed info

## Email Notifications

Guests receive emails for:

- **Refund Successful:** When refund is processed by Razorpay
- **Refund Failed:** When refund processing fails

Requires `SENDGRID_FROM_EMAIL` to be verified in SendGrid dashboard.

## Monitoring

### Check System Status

```bash
# See pending refunds count and amount
curl -X GET http://localhost:8080/api/payments/pending-refunds-stats \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Review Logs

Look for these patterns in server logs:

```
🔄 CHECKING PENDING REFUNDS FROM RAZORPAY        # Periodic check started
✅ Refund SUCCEEDED                                  # Refund processed
❌ Refund FAILED                                     # Refund failed
⏳ Refund still PENDING                              # Still waiting on Razorpay
📧 Sending refund success email                     # Email sent
```

## Troubleshooting

### Scheduler Not Starting

**Error:** Module not found: `node-cron`

**Solution:**
```bash
cd backend
npm install node-cron
npm start
```

### Refunds Not Updating

**Check 1:** Verify pending refunds exist
```bash
curl -X GET http://localhost:8080/api/payments/pending-refunds-stats
```

**Check 2:** Test Razorpay credentials
- Verify API keys in `.env` file
- Keys should start with `rzp_` (test) or `rzp_live_` (production)

**Check 3:** Manually trigger check
```bash
curl -X POST http://localhost:8080/api/payments/update-pending-refunds
```

### Emails Not Sending

**Check 1:** Verify SendGrid API key is set in `.env`
```bash
echo $SENDGRID_API_KEY
```

**Check 2:** Verify email is verified in SendGrid dashboard
- Go to SendGrid Settings → Sender Authentication
- Email in `SENDGRID_FROM_EMAIL` must be verified

**Check 3:** Check server logs for SendGrid errors

## Performance Considerations

- **Check frequency:** Every 30 minutes (configurable)
- **API calls:** One per pending refund
- **Database queries:** Optimized with proper indexes
- **Email rate:** Delayed by 1 second between sends to avoid limits

## Next Steps

1. **Test the system:** Make a booking and cancel to generate a refund
2. **Monitor logs:** Watch for automatic checks every 30 minutes
3. **Review documentation:** See [REFUND_STATUS_MANAGEMENT.md](./REFUND_STATUS_MANAGEMENT.md)
4. **Deploy:** Push to git and deploy to Render

## Commands Quick Reference

```bash
# Install dependencies
npm install

# Start server with scheduler
npm start

# Check refund stats
curl -X GET http://localhost:8080/api/payments/pending-refunds-stats -H "Authorization: Bearer TOKEN"

# Manual refund check
curl -X POST http://localhost:8080/api/payments/update-pending-refunds -H "Authorization: Bearer TOKEN"

# Check specific refund
curl -X POST http://localhost:8080/api/payments/check-refund/RESERVATION_ID -H "Authorization: Bearer TOKEN"
```

---

**Questions or Issues?** 
Check the server logs and review [REFUND_STATUS_MANAGEMENT.md](./REFUND_STATUS_MANAGEMENT.md) for detailed information.
