# Refund Status Updates - Monitoring Guide

## How to Know if Refund Status is Updating

### 1. **Watch Server Console Logs** (Real-time)

When the system checks refunds, you'll see logs like this:

```
============================================================
🔄 CHECKING PENDING REFUNDS FROM RAZORPAY
============================================================
⏰ Timestamp: 2026-02-07T10:30:00.000Z
🔍 Querying database for pending/initiated refunds...
📊 Found 2 reservations with pending refunds

🔍 Fetching refund status for: rfnd_1234567890
   Current DB Status: refund-pending | Refund Status: initiated
   ✅ Got Razorpay Response
      - Razorpay Refund Status: processed
      - Amount: ₹5000

🔄 STATUS CHANGED - UPDATING DATABASE
   Reservation Status: refund-pending → refunded
   Refund Status: initiated → completed
   ✅ Reservation record updated in DB
   ✅ Cancellation record updated in DB
   📧 Sending refund success email to guest@example.com

============================================================
📈 REFUND CHECK SUMMARY
============================================================
✅ Updated: 1
ℹ️  Unchanged: 1
❌ Errors: 0
📊 Total Checked: 2

📋 RESERVATIONS UPDATED:
   ✅ 507f1f77bcf86cd799439011
      • Status: refund-pending → refunded
      • Refund Amount: ₹5000
      • Guest: guest@example.com
============================================================
```

### 2. **Check Automatic Scheduled Runs**

The system runs automatically **every 30 minutes**:

- **At minute :00** - 12:00, 13:00, 14:00, etc.
- **At minute :30** - 12:30, 13:30, 14:30, etc.

You'll see the logs appear automatically at these times.

### 3. **API Endpoints for Testing**

#### A. See Current Pending Refunds (No update, just listing)

```bash
curl -X GET http://localhost:8080/api/payments/list-pending-refunds \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response Shows:**
- Reservation ID
- Guest email & name
- Listing title
- Current DB Status
- Refund Transaction ID
- Check-in/Check-out dates

```json
{
  "message": "Pending refunds list",
  "count": 2,
  "data": [
    {
      "reservationId": "507f1f77bcf86cd799439011",
      "guestEmail": "guest@example.com",
      "guestName": "John",
      "listingTitle": "Cozy Apartment",
      "status": "refund-pending",
      "refundStatus": "initiated",
      "refundAmount": "₹5000",
      "refundTransactionId": "rfnd_1234567890"
    }
  ]
}
```

#### B. Get Refund Statistics

```bash
curl -X GET http://localhost:8080/api/payments/pending-refunds-stats \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response Shows:**
- Count grouped by refund status
- Total amount by status

```json
{
  "message": "Pending refunds statistics",
  "data": {
    "byStatus": [
      {
        "_id": "initiated",
        "count": 2,
        "totalAmount": 10000
      },
      {
        "_id": "pending",
        "count": 1,
        "totalAmount": 3000
      }
    ],
    "timestamp": "2026-02-07T10:30:00Z"
  }
}
```

#### C. Manually Trigger Refund Check (Check & Update)

```bash
curl -X POST http://localhost:8080/api/payments/update-pending-refunds \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Console Output Example:**
```
🔄 Manual trigger: Updating all pending refunds from Razorpay
============================================================
🔄 CHECKING PENDING REFUNDS FROM RAZORPAY
============================================================
[... same detailed logs as above ...]
```

**Response Shows:**
- Summary of what was updated
- List of updated reservations

```json
{
  "message": "Pending refunds checked and updated",
  "summary": {
    "total": 2,
    "updated": 1,
    "unchanged": 1,
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

#### D. Check Specific Reservation Refund

```bash
curl -X POST http://localhost:8080/api/payments/check-refund/507f1f77bcf86cd799439011 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Testing Workflow

### Step 1: Create Pending Refund

1. Make a booking
2. Cancel the booking (make sure refund is applicable)
3. Refund will be initiated to Razorpay

### Step 2: Check List of Pending Refunds

```bash
curl -X GET http://localhost:8080/api/payments/list-pending-refunds \
  -H "Authorization: Bearer TOKEN"
```

You should see your refund in the list with:
- `refundStatus: "initiated"`
- `status: "refund-pending"`
- A `refundTransactionId`

### Step 3: Wait or Manually Trigger Check

**Option A: Wait for automatic check**
- Next check runs at :00 or :30 of the hour
- Watch console for logs

**Option B: Manually trigger**
```bash
curl -X POST http://localhost:8080/api/payments/update-pending-refunds \
  -H "Authorization: Bearer TOKEN"
```

### Step 4: Verify Update

Check the list again:
```bash
curl -X GET http://localhost:8080/api/payments/list-pending-refunds \
  -H "Authorization: Bearer TOKEN"
```

If Razorpay processed the refund, you should see:
- `refundStatus: "completed"` (was "initiated")
- `status: "refunded"` (was "refund-pending")

## Console Log Indicators

| Symbol | Meaning | Action |
|--------|---------|--------|
| 🔄 | Starting check | System checking refunds |
| 🔍 | Fetching data | Querying Razorpay API |
| ✅ | Success | Updates made or success action |
| ❌ | Error | Problem occurred |
| ⏰ | Time | Timestamp of action |
| 📊 | Statistics | Summary information |
| 📧 | Email | Sending notification |
| 📋 | List/Details | Showing data |
| ⚠️ | Warning | Non-critical issue |
| ℹ️ | Info | Informational message |

## What to Look For

### ✅ Good Signs (System Working)

```
✅ Reservation record updated in DB
✅ Cancellation record updated in DB
📧 Sending refund success email
✅ Updated: 1
```

### ⚠️ Warning Signs

```
⚠️ No refund transaction ID found        → Refund was never initiated
ℹ️ No status change - DB already current → Razorpay still processing
```

### ❌ Error Signs

```
❌ Error in updateAllPendingRefunds     → API/Database error
❌ Refund FAILED                         → Razorpay failed the refund
❌ Errors: 1                             → One refund had an error
```

## Troubleshooting

### Q: I don't see any logs at all

**A:** Check if:
1. Refunds exist with `refundTransactionId`
2. Time is at :00 or :30 (automatic run)
3. Manually trigger: `POST /api/payments/update-pending-refunds`

### Q: Logs show "No refund transaction ID found"

**A:** The refund wasn't initialized properly. Check if:
1. Booking was actually cancelled
2. Razorpay refund was created successfully
3. Use `list-pending-refunds` to see which reservations exist

### Q: Status shows "unchanged" every time

**A:** Either:
1. Razorpay refund is still pending (normal, will change later)
2. Refund was already processed before
3. Use `list-pending-refunds` to verify refund status in DB

## Quick Commands

```bash
# See pending refunds
curl -GET http://localhost:8080/api/payments/list-pending-refunds -H "Authorization: Bearer TOKEN"

# Trigger manual check (watch console!)
curl -X POST http://localhost:8080/api/payments/update-pending-refunds -H "Authorization: Bearer TOKEN"

# Get stats
curl -X GET http://localhost:8080/api/payments/pending-refunds-stats -H "Authorization: Bearer TOKEN"
```

## Monitoring in Production (Render)

1. **View Live Logs:**
   - Go to Render Dashboard → Your Backend → Logs
   - Search for "🔄 CHECKING PENDING REFUNDS"
   - Logs appear every 30 minutes

2. **Check Only:**
   - Call `GET /api/payments/list-pending-refunds` from your app
   - No console access needed

3. **Manual Check:**
   - Call `POST /api/payments/update-pending-refunds` from your app
   - Results in JSON response

---

**Key Takeaway:** 
- **Console logs** = Detailed real-time updates (development)
- **API endpoints** = Monitoring and verification (any time)
- **Automatic runs** = Every 30 minutes (no action needed)
