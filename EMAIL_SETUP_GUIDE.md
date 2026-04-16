# Email Feature Setup Guide

This guide explains how to set up and use the Nodemailer email feature in the AirLite project.

## 📧 Overview

The email feature sends automated emails for the following events:
- **Signup**: Welcome email when a new user registers
- **Email Verification**: Email with verification link (template ready for future use)
- **Login**: Security notification when users log in
- **Listing Created**: Confirmation when hosts create a new listing
- **Reservation**: Booking confirmation email
- **Payment Success**: Payment receipt and booking details

## 🚀 Setup Instructions

### Step 1: Install Dependencies (Already Done)
```bash
cd backend
npm install nodemailer
```

### Step 2: Configure Environment Variables

Add the following variables to your `backend/.env` file:

```env
# Email Configuration
MAIL_SERVICE=gmail
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=your-email@gmail.com
MAIL_PASSWORD=your-app-password

# Frontend URL for email links
FRONTEND_URL=http://localhost:3000
```

### Step 3: Gmail Setup (Recommended for Development)

1. **Enable 2-Factor Authentication** in your Google Account:
   - Go to https://myaccount.google.com/security
   - Enable 2-Factor Authentication

2. **Generate an App Password**:
   - Visit https://myaccount.google.com/apppasswords
   - Select "Mail" and "Other (Custom name)"
   - Name it "AirLite" or similar
   - Copy the 16-character password

3. **Update .env**:
   ```env
   MAIL_USER=your-email@gmail.com
   MAIL_PASSWORD=xxxx-xxxx-xxxx-xxxx  # Use the app password here
   ```

### Alternative Email Services

#### SendGrid
```env
MAIL_SERVICE=SendGrid
MAIL_HOST=smtp.sendgrid.net
MAIL_PORT=587
MAIL_USER=apikey
MAIL_PASSWORD=your-sendgrid-api-key
```

#### Mailgun
```env
MAIL_SERVICE=Mailgun
MAIL_HOST=smtp.mailgun.org
MAIL_PORT=587
MAIL_USER=your-mailgun-username
MAIL_PASSWORD=your-mailgun-password
```

#### Outlook/Hotmail
```env
MAIL_SERVICE=hotmail
MAIL_HOST=smtp-mail.outlook.com
MAIL_PORT=587
MAIL_USER=your-email@outlook.com
MAIL_PASSWORD=your-password
```

## 📁 File Structure

```
backend/
├── config/
│   └── mail.config.js          # Nodemailer transporter configuration
├── utils/
│   ├── mail.util.js            # Email service functions
│   └── emailTemplates.js       # HTML email templates
├── controllers/
│   ├── user.controller.js      # Signup & login emails integrated
│   ├── listing.controller.js   # Listing created emails integrated
│   └── payment.controller.js   # Payment & reservation emails integrated
└── .env.example.mail           # Example environment variables
```

## 🎨 Email Templates

All email templates use a consistent, professional design with:
- Gradient purple header with AirLite branding
- Responsive layout (mobile-friendly)
- Clear call-to-action buttons
- Information boxes for key details
- Footer with links and copyright

### Available Templates:

1. **Signup Email** (`signupTemplate`)
   - Welcome message
   - Platform features overview
   - Call-to-action to explore listings

2. **Email Verification** (`verifyEmailTemplate`)
   - Verification link with token
   - 24-hour expiration notice
   - Security notice

3. **Login Notification** (`loginTemplate`)
   - Login time and location
   - Device and IP information
   - Security action button

4. **Listing Created** (`listingCreatedTemplate`)
   - Property details
   - Price and location
   - Link to view listing
   - Host tips

5. **Reservation Confirmation** (`reservationTemplate`)
   - Booking details
   - Check-in/check-out dates
   - Number of guests and nights
   - Important information

6. **Payment Success** (`paymentSuccessTemplate`)
   - Payment details and receipt
   - Transaction information
   - Complete booking summary
   - Next steps

## 🔧 Usage

The email functions are automatically triggered in the controllers:

### User Registration
```javascript
// In user.controller.js - register function
sendSignupEmail({
  email: user.email,
  name: user.firstName,
  username: user.firstName,
}).catch(err => console.error('Failed to send signup email:', err));
```

### User Login
```javascript
// In user.controller.js - login function
sendLoginEmail(
  { email, name, username },
  { time, device, location, ip }
).catch(err => console.error('Failed to send login email:', err));
```

### Listing Created
```javascript
// In listing.controller.js - createListing function
sendListingCreatedEmail(
  { email, name, username },
  { _id, title, location, price, category }
).catch(err => console.error('Failed to send listing created email:', err));
```

### Payment & Reservation
```javascript
// In payment.controller.js - verifyPayment function
sendReservationEmail(user, reservation, listing)
  .catch(err => console.error('Failed to send reservation email:', err));

sendPaymentSuccessEmail(user, payment, reservation, listing)
  .catch(err => console.error('Failed to send payment success email:', err));
```

## 🧪 Testing

### Test Email Sending

Create a test route to verify your email configuration:

```javascript
// In backend/routes/test.route.js
const { sendSignupEmail } = require('../utils/mail.util');

router.get('/test-email', async (req, res) => {
  try {
    await sendSignupEmail({
      email: 'test@example.com',
      name: 'Test User',
      username: 'testuser',
    });
    res.json({ message: 'Test email sent successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### Check Email Logs

All email operations log to the console:
- ✅ Success: "Email sent: <message-id>"
- ❌ Error: "Failed to send [type] email: <error>"

## 🛡️ Error Handling

All email functions use `.catch()` to handle errors gracefully without breaking the main application flow:

```javascript
sendSignupEmail(user)
  .catch(err => console.error('Failed to send signup email:', err));
```

This ensures that if email sending fails:
- User registration/login still completes
- Errors are logged for debugging
- Application continues normally

## 🎯 Best Practices

1. **Use App Passwords**: Never use your actual Gmail password
2. **Environment Variables**: Keep credentials in .env, never commit them
3. **Async Handling**: Emails are sent asynchronously to not block API responses
4. **Error Logging**: All email errors are logged for monitoring
5. **Template Consistency**: All templates use the same base design
6. **Mobile Responsive**: Templates are tested for mobile devices

## 📊 Production Considerations

For production deployment:

1. **Use a Professional Email Service**:
   - SendGrid (99% delivery rate)
   - Mailgun (scalable, good analytics)
   - AWS SES (cost-effective for high volume)

2. **Set Up Email Monitoring**:
   - Track delivery rates
   - Monitor bounce rates
   - Watch for spam complaints

3. **Compliance**:
   - Include unsubscribe links
   - Follow CAN-SPAM Act guidelines
   - Respect GDPR for EU users

4. **Rate Limiting**:
   - Gmail free tier: ~500 emails/day
   - Implement queuing for high volume
   - Use dedicated SMTP service for scale

## 🐛 Troubleshooting

### Email not sending?
1. Check .env variables are set correctly
2. Verify MAIL_USER and MAIL_PASSWORD
3. For Gmail, ensure 2FA and App Password are configured
4. Check console for error messages
5. Test with simple email first

### Emails going to spam?
1. Use a verified sending domain
2. Set up SPF/DKIM records
3. Use professional email service (SendGrid, etc.)
4. Avoid spam trigger words in content

### Template not rendering?
1. Check HTML syntax in emailTemplates.js
2. Test with email preview tools
3. Verify all variables are passed correctly

## 📝 Notes

- Email verification feature is templated but not fully integrated (requires verification token generation and route)
- All emails are sent asynchronously to not block API responses
- Email sending failures are logged but don't affect main operations
- Templates are mobile-responsive and tested across email clients

## 🔗 Related Files

- Configuration: [backend/config/mail.config.js](backend/config/mail.config.js)
- Email Service: [backend/utils/mail.util.js](backend/utils/mail.util.js)
- Templates: [backend/utils/emailTemplates.js](backend/utils/emailTemplates.js)
- Environment Example: [backend/.env.example.mail](backend/.env.example.mail)

---

**Need Help?** Check the logs in your terminal or review the email service files for more details.
