# Backend Config Directory

This directory contains configuration files for external services and integrations used by the AirLite backend.

## 📋 Overview

The `config/` directory houses centralized configuration for third-party services such as:
- Cloud storage (Cloudinary)
- Email service (Nodemailer)

Configurations are separate from the main application to promote:
- Reusability across controllers
- Easy maintenance and updates
- Separation of concerns

## 📁 Files

### `cloudinary.js`
Cloudinary configuration for image upload and storage.

**Purpose:**
- Initializes Cloudinary with API credentials
- Configures multer storage for Cloudinary integration
- Sets up image folder structure and formats

**Exports:**
- `cloudinary` - Configured Cloudinary client
- `storage` - Multer Cloudinary storage configuration

**Environment Variables Required:**
```env
CLOUD_NAME=your_cloudinary_cloud_name
CLOUD_API_KEY=your_api_key
CLOUD_API_SECRET=your_api_secret
```

**Usage Example:**
```javascript
const { cloudinary, storage } = require('./config/cloudinary');

// In multer middleware
const upload = multer({ storage });
```

**Configuration Details:**
- **Folder:** Images are stored in `Airbnb_DEV` folder on Cloudinary
- **Allowed Formats:** PNG, JPG, JPEG
- **Storage Type:** Multer Cloudinary storage

---

### `mail.config.js`
Email service configuration for sending transactional emails.

**Purpose:**
- Initializes email transporter (Nodemailer)
- Handles connection to email service provider
- Manages SMTP configuration

**Exports:**
- `createTransporter()` - Function that returns configured email transporter

**Environment Variables Required:**
```env
MAIL_USER=your_email@gmail.com
MAIL_PASS=your_app_password
# OR use SendGrid
SENDGRID_API_KEY=your_sendgrid_api_key
```

**Service Providers Supported:**
- Gmail SMTP
- SendGrid API
- Nodemailer-compatible SMTP services

**Usage Example:**
```javascript
const createTransporter = require('./config/mail.config');
const transporter = createTransporter();

await transporter.sendMail({
  to: 'user@example.com',
  subject: 'Welcome!',
  html: '<h1>Welcome to AirLite</h1>'
});
```

---

## 🔧 Setup Instructions

### Cloudinary Setup

1. Create a Cloudinary account at [cloudinary.com](https://cloudinary.com)
2. Navigate to Dashboard and copy:
   - Cloud Name
   - API Key
   - API Secret

3. Add to `.env`:
```env
CLOUD_NAME=your_cloud_name
CLOUD_API_KEY=your_api_key
CLOUD_API_SECRET=your_api_secret
```

4. In Cloudinary Dashboard, create a folder named `Airbnb_DEV` for development

### Email Setup

#### Option 1: Gmail with Nodemailer
1. Enable 2FA on your Gmail account
2. Generate an [App Password](https://support.google.com/accounts/answer/185833)
3. Add to `.env`:
```env
MAIL_USER=your.email@gmail.com
MAIL_PASS=your_16_character_app_password
```

#### Option 2: SendGrid
1. Create account at [sendgrid.com](https://sendgrid.com)
2. Create API key from Settings > API Keys
3. Add to `.env`:
```env
SENDGRID_API_KEY=SG.your_api_key_here
MAIL_USER=your_verified_sender@domain.com
```

See [../EMAIL_SETUP_GUIDE.md](../EMAIL_SETUP_GUIDE.md) for detailed email configuration.

---

## 🔐 Security Best Practices

1. **Never commit `.env` files** - Keep credentials out of version control
2. **Rotate API keys** - Regularly update API keys in services
3. **Use environment-specific keys** - Separate dev and production credentials
4. **Restrict API key permissions** - Only grant necessary permissions in Cloudinary/SendGrid
5. **Monitor usage** - Check API usage logs regularly for suspicious activity

---

## 🚀 Usage in Controllers

### Image Upload
```javascript
const { storage } = require('../config/cloudinary');
const multer = require('multer');
const upload = multer({ storage });

// In routes
router.post('/upload', upload.array('images'), (req, res) => {
  // req.files contains uploaded files with URLs
});
```

### Sending Emails
```javascript
const createTransporter = require('../config/mail.config');

async function sendWelcomeEmail(userEmail) {
  const transporter = createTransporter();
  
  await transporter.sendMail({
    from: process.env.MAIL_USER,
    to: userEmail,
    subject: 'Welcome to AirLite',
    html: '<h1>Welcome!</h1>'
  });
}
```

---

## 🔗 Related Files

- [../controllers/listing.controller.js](../controllers/listing.controller.js) - Uses Cloudinary config for image uploads
- [../utils/mail.util.js](../utils/mail.util.js) - Uses mail.config for sending emails
- [../middlewares/multer.middleware.js](../middlewares/multer.middleware.js) - Uses Cloudinary storage
- [../EMAIL_SETUP_GUIDE.md](../EMAIL_SETUP_GUIDE.md) - Detailed email configuration guide

---

## 📝 Adding New Configuration

To add a new service configuration:

1. Create a new file (e.g., `yoursettings.config.js`)
2. Initialize and export the service
3. Document required environment variables
4. Add setup instructions to this README
5. Update deployment guides

---

## ⚙️ Troubleshooting

### Cloudinary Upload Fails
- **Issue:** "Authentication failed"
  - **Solution:** Verify `CLOUD_NAME`, `CLOUD_API_KEY`, `CLOUD_API_SECRET`
  
- **Issue:** "Unsupported file format"
  - **Solution:** Ensure image is PNG, JPG, or JPEG

### Email Not Sending
- **Issue:** "Invalid credentials"
  - **Solution:** Verify `MAIL_USER` and `MAIL_PASS` (or `SENDGRID_API_KEY`)
  
- **Issue:** "Connection refused"
  - **Solution:** Check internet connection and SMTP server status

---

## 📚 Resources

- [Cloudinary Documentation](https://cloudinary.com/documentation)
- [Nodemailer Documentation](https://nodemailer.com)
- [SendGrid Documentation](https://docs.sendgrid.com)
- [Multer Documentation](https://expressjs.com/en/resources/middleware/multer.html)

