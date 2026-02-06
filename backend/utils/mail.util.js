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
 * Send email using nodemailer
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email address
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML content
 * @param {string} options.text - Plain text content (optional)
 * @returns {Promise} - Promise resolving to email info
 */
const sendEmail = async (options) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"AirLite" <${process.env.MAIL_USER}>`, // sender address
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent: ' + info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
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
