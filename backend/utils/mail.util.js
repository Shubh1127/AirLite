const createTransporter = require('../config/mail.config');
const {
  signupTemplate,
  verifyEmailTemplate,
  loginTemplate,
  listingCreatedTemplate,
  reservationTemplate,
  paymentSuccessTemplate,
  reservationCancelledTemplate,
  refundInitiatedTemplate,
  refundSuccessfulTemplate,
  refundFailedTemplate,
} = require('./emailTemplates');

/**
 * Send email with retry logic
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email address
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML content
 * @param {string} options.text - Plain text content (optional)
 * @param {number} retries - Number of retry attempts (default: 3)
 * @returns {Promise} - Promise resolving to email info
 */
const sendEmail = async (options, retries = 3) => {
  let lastError;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const transporter = createTransporter();

      // Use verified SendGrid sender or Gmail sender
      const fromEmail = process.env.SENDGRID_API_KEY 
        ? (process.env.SENDGRID_FROM_EMAIL || 'noreply@airlite.com')
        : process.env.MAIL_USER;

      const mailOptions = {
        from: `"AirLite" <${fromEmail}>`,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
      };

      const info = await transporter.sendMail(mailOptions);
      console.log(`Email sent successfully (attempt ${attempt}): ${info.messageId}`);
      return info;
      console.log(`Email sent successfully (attempt ${attempt}): ${info.messageId}`);
      return info;
    } catch (error) {
      lastError = error;
      console.error(`Email send attempt ${attempt}/${retries} failed:`, error.message);

      // Only retry on specific timeout/connection errors
      if (attempt < retries && (error.code === 'ETIMEDOUT' || error.code === 'ECONNREFUSED' || error.code === 'NetworkError')) {
        const delayMs = Math.pow(2, attempt - 1) * 1000; // Exponential backoff: 1s, 2s, 4s
        console.log(`Retrying in ${delayMs}ms...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      } else {
        // Don't retry for other errors
        break;
      }
    }
  }

  // Log final error and throw
  console.error('Email failed after all retries:', lastError?.message);
  throw lastError || new Error('Failed to send email after multiple attempts');
};

/**
 * Send signup email
 */
const sendSignupEmail = async (user) => {
  const html = signupTemplate(user);
  return sendEmail({
    to: user.email,
    subject: 'Welcome to AirLite! 🎉',
    html,
  });
};

/**
 * Send email verification
 */
const sendVerificationEmail = async (user, verificationToken) => {
  const verificationUrl = `${process.env.FRONTEND_URL}/auth/verify-email?token=${verificationToken}`;
  const html = verifyEmailTemplate(user, verificationUrl);
  return sendEmail({
    to: user.email,
    subject: 'Verify Your Email Address',
    html,
  });
};

/**
 * Send login notification email
 */
const sendLoginEmail = async (user, loginDetails) => {
  const html = loginTemplate(user, loginDetails);
  return sendEmail({
    to: user.email,
    subject: 'New Login to Your AirLite Account',
    html,
  });
};

/**
 * Send listing created email
 */
const sendListingCreatedEmail = async (user, listing) => {
  const html = listingCreatedTemplate(user, listing);
  return sendEmail({
    to: user.email,
    subject: 'Your Listing Has Been Created! 🏠',
    html,
  });
};

/**
 * Send reservation confirmation email
 */
const sendReservationEmail = async (user, reservation, listing) => {
  const html = reservationTemplate(user, reservation, listing);
  return sendEmail({
    to: user.email,
    subject: 'Reservation Confirmed! 📅',
    html,
  });
};

/**
 * Send payment success email
 */
const sendPaymentSuccessEmail = async (user, payment, reservation, listing) => {
  const html = paymentSuccessTemplate(user, payment, reservation, listing);
  return sendEmail({
    to: user.email,
    subject: 'Payment Successful! ✅',
    html,
  });
};

/**
 * Send reservation cancelled email
 */
const sendReservationCancelledEmail = async (user, reservation, listing, refundInfo) => {
  const html = reservationCancelledTemplate(user, reservation, listing, refundInfo);
  return sendEmail({
    to: user.email,
    subject: 'Reservation Cancelled 📋',
    html,
  });
};

/**
 * Send refund initiated email
 */
const sendRefundInitiatedEmail = async (user, reservation, listing, refundInfo) => {
  const html = refundInitiatedTemplate(user, reservation, listing, refundInfo);
  return sendEmail({
    to: user.email,
    subject: 'Refund Initiated 💰',
    html,
  });
};

/**
 * Send refund successful email
 */
const sendRefundSuccessfulEmail = async (user, reservation, listing, refundInfo) => {
  const html = refundSuccessfulTemplate(user, reservation, listing, refundInfo);
  return sendEmail({
    to: user.email,
    subject: 'Refund Successfully Completed! ✅',
    html,
  });
};

/**
 * Send refund failed email
 */
const sendRefundFailedEmail = async (user, reservation, listing, refundInfo) => {
  const html = refundFailedTemplate(user, reservation, listing, refundInfo);
  return sendEmail({
    to: user.email,
    subject: 'Refund Failed - We Need Your Help ⚠️',
    html,
  });
};

module.exports = {
  sendEmail,
  sendSignupEmail,
  sendVerificationEmail,
  sendLoginEmail,
  sendListingCreatedEmail,
  sendReservationEmail,
  sendPaymentSuccessEmail,
  sendReservationCancelledEmail,
  sendRefundInitiatedEmail,
  sendRefundSuccessfulEmail,
  sendRefundFailedEmail,
};
