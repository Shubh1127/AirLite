# Razorpay Webhook Setup Guide

This guide shows how to configure Razorpay webhooks for the AirLite application.

## Webhook Endpoint

The webhook endpoint is available at:
```
POST /api/webhooks/razorpay
```

**Full URL (Production):**
```
https://yourdomain.com/api/webhooks/razorpay
```

**Full URL (Development - using ngrok for local testing):**
```
https://your-ngrok-url.ngrok.io/api/webhooks/razorpay
```

## Setting Up Webhooks in Razorpay Dashboard

### Step 1: Access Razorpay Dashboard
1. Go to [Razorpay Dashboard](https://dashboard.razorpay.com)
2. Navigate to **Settings** → **Webhooks** (or **Settings** → **API Keys** → **Webhooks**)

### Step 2: Create New Webhook
1. Click **Create a new webhook** or **+ Add Webhook**
2. Enter the webhook URL: `https://yourdomain.com/api/webhooks/razorpay`
3. Select the events you want to listen for

## Events Configuration

Configure the following events in Razorpay:

### Refund Events (Required)
- ✅ **refund.processed** - Triggered when a refund is successfully processed
- ✅ **refund.failed** - Triggered when a refund fails

### Optional Events (for monitoring)
- `refund.created` - Logged but not actively handled

## Event Details

### 1. refund.processed
**When triggered:** When Razorpay successfully processes a refund to the customer's account
**What happens:**
- Updates reservation status to `refunded`
- Sets refundStatus to `completed`
- Updates Cancellation record as complete
- Sends "Refund Successfully Completed" email to customer

### 2. refund.failed
**When triggered:** When Razorpay fails to process a refund
**What happens:**
- Sets refundStatus to `failed`
- Updates Cancellation record with failure reason
- Sends "Refund Failed" email to customer asking them to contact support

## Webhook Signature Verification

The webhook handler verifies all incoming webhook requests using **SHA256 HMAC** signature verification:

1. Razorpay sends the `X-Razorpay-Signature` header
2. Backend recreates the signature using:
   - `RAZORPAY_KEY_SECRET` from environment variables
   - Request body (JSON stringified)
3. Signatures must match, otherwise webhook is rejected with 401 status

**Security Features:**
- ✅ Signature verification required for all webhooks
- ✅ Only requests from Razorpay will be processed
- ✅ Man-in-the-middle attacks prevented
- ✅ Webhook authenticity guaranteed

## Testing Webhooks Locally (with ngrok)

### Setup ngrok
```bash
# Install ngrok
npm install -g ngrok

# Start ngrok tunnel (points to http://localhost:8080)
ngrok http 8080
# Output: Forwarding https://xxxx-xxxx-xxxx.ngrok.io -> http://localhost:8080
```

### Update Razorpay Webhook URL
Use the ngrok URL: `https://xxxx-xxxx-xxxx.ngrok.io/api/webhooks/razorpay`

### Test with Razorpay Event
Use Razorpay's webhook testing feature in the dashboard to send test events.

## Environment Variables

Ensure these are set in your `.env`:
```
RAZORPAY_KEY_ID=<your-razorpay-key-id>
RAZORPAY_KEY_SECRET=<your-razorpay-key-secret>
```

## Response Format

All webhook responses return:
```json
{
  "status": "ok"
}
```

**HTTP Status Codes:**
- `200` - Webhook processed successfully
- `401` - Invalid signature
- `500` - Server error during processing

## Monitoring & Debugging

### View Webhook Logs
Check backend console logs for:
- `Processing webhook event: [event_type]`
- Refund success/failure messages
- Email sending status
- Error messages

### Razorpay Webhook Logs
In Razorpay Dashboard → **Webhooks** → Click on webhook to see:
- Delivery attempts
- Response status
- Request/response body
- Timestamps

## Retry Policy

Razorpay automatically retries failed webhooks:
- **1st attempt:** Immediate
- **2nd attempt:** 1 minute later
- **3rd attempt:** 5 minutes later
- **4th attempt:** 30 minutes later
- **5th attempt:** 2 hours later
- **6th attempt:** 5 hours later
- **7th attempt:** Next day

## Webhook Event Structure

### refund.processed Example
```json
{
  "event": "refund.processed",
  "payload": {
    "refund": {
      "id": "rfnd_1234567890",
      "entity": "refund",
      "payment_id": "pay_1234567890",
      "amount": 50000,
      "currency": "INR",
      "notes": [],
      "receipt": null,
      "status": "processed",
      "reason": null,
      "source": "api",
      "receipt_number": null,
      "batch_id": null,
      "failure_reason": null,
      "description": "Refunded",
      "shorturl": "https://rzp.io/i/w2CEwYx",
      "speed_processed": "normal",
      "speed_requested": "normal",
      "acquirer_data": {...},
      "created_at": 1644816000,
      "updated_at": 1644816000
    }
  }
}
```

## Troubleshooting

### Webhook not received?
1. ✅ Check Razorpay webhook is active (enabled toggle)
2. ✅ Verify webhook URL is correct
3. ✅ Check server is running and accessible
4. ✅ Check firewall/CORS settings
5. ✅ Review Razorpay webhook delivery logs

### Signature verification failing?
1. ✅ Verify `RAZORPAY_KEY_SECRET` is correct
2. ✅ Ensure webhook URL matches exactly
3. ✅ Check for any middleware that modifies request body

### Emails not sending?
1. ✅ Verify mail configuration in `config/mail.config.js`
2. ✅ Check environment variables (mail service credentials)
3. ✅ Review backend logs for email errors

## Next Steps

1. Set up webhooks in Razorpay dashboard
2. Test with sample events
3. Monitor webhook delivery in production
4. Set up alerts for failed webhooks
5. Test refund.processed and refund.failed events

## Additional Resources

- [Razorpay Webhooks Documentation](https://razorpay.com/docs/webhooks/)
- [Razorpay API Reference](https://razorpay.com/docs/api/)
- [Razorpay Dashboard](https://dashboard.razorpay.com)
