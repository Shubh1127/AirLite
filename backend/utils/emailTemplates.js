/**
 * Base email template wrapper
 */
const baseTemplate = (content) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>AirLite</title>
      <style>
        body {
          margin: 0;
          padding: 0;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          background-color: #f5f5f5;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background-color: #ffffff;
        }
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 40px 20px;
          text-align: center;
        }
        .logo {
          color: #ffffff;
          font-size: 32px;
          font-weight: bold;
          margin: 0;
        }
        .content {
          padding: 40px 30px;
          color: #333333;
        }
        .content h1 {
          color: #667eea;
          font-size: 24px;
          margin-bottom: 20px;
        }
        .content p {
          line-height: 1.6;
          margin-bottom: 15px;
          color: #555555;
        }
        .button {
          display: inline-block;
          padding: 14px 30px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: #ffffff !important;
          text-decoration: none;
          border-radius: 8px;
          margin: 20px 0;
          font-weight: 600;
        }
        .info-box {
          background-color: #f8f9fa;
          border-left: 4px solid #667eea;
          padding: 20px;
          margin: 20px 0;
          border-radius: 4px;
        }
        .info-box p {
          margin: 8px 0;
        }
        .info-box strong {
          color: #333333;
        }
        .footer {
          background-color: #f8f9fa;
          padding: 30px;
          text-align: center;
          color: #888888;
          font-size: 14px;
        }
        .footer a {
          color: #667eea;
          text-decoration: none;
        }
        .divider {
          border: 0;
          height: 1px;
          background: #e0e0e0;
          margin: 30px 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 class="logo">AirLite</h1>
        </div>
        <div class="content">
          ${content}
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} AirLite. All rights reserved.</p>
          <p>
            <a href="${process.env.FRONTEND_URL}">Visit our website</a> | 
            <a href="${process.env.FRONTEND_URL}/support">Support</a> | 
            <a href="${process.env.FRONTEND_URL}/terms">Terms</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
};

/**
 * Signup email template
 */
const signupTemplate = (user) => {
  const content = `
    <h1>Welcome to AirLite! 🎉</h1>
    <p>Hi ${user.name || user.username},</p>
    <p>Thank you for signing up with AirLite! We're thrilled to have you as part of our community.</p>
    <p>With AirLite, you can:</p>
    <div class="info-box">
      <p>✨ Discover unique places to stay around the world</p>
      <p>🏠 List your property and become a host</p>
      <p>💼 Manage your bookings and reservations</p>
      <p>⭐ Share your experiences through reviews</p>
    </div>
    <p>Start exploring amazing properties or list your own space today!</p>
    <a href="${process.env.FRONTEND_URL}" class="button">Explore AirLite</a>
    <p>If you have any questions, feel free to reach out to our support team.</p>
    <p>Happy travels!<br>The AirLite Team</p>
  `;
  return baseTemplate(content);
};

/**
 * Email verification template with code
 */
const verifyEmailTemplate = (user, verificationCode) => {
  const content = `
    <h1>Verify Your Email Address ✉️</h1>
    <p>Hi ${user.name || user.username},</p>
    <p>Thank you for signing up with AirLite! To complete your registration and start using all features, please use the verification code below:</p>
    <div class="info-box" style="text-align: center; padding: 30px; margin: 30px 0;">
      <p style="margin: 0 0 10px 0; font-size: 14px; color: #666;">Your Verification Code</p>
      <p style="margin: 0; font-size: 42px; font-weight: bold; letter-spacing: 8px; color: #667eea; font-family: monospace;">${verificationCode}</p>
    </div>
    <p>This code will expire in <strong>15 minutes</strong> for security reasons.</p>
    <p>If you didn't create an account with AirLite, please ignore this email.</p>
    <hr class="divider">
    <p style="color: #888888; font-size: 12px;">For security reasons, never share this code with anyone. AirLite will never ask for this code.</p>
  `;
  return baseTemplate(content);
};

/**
 * Login notification template
 */
const loginTemplate = (user, loginDetails) => {
  const { device, location, time, ip } = loginDetails;
  const content = `
    <h1>New Login to Your Account 🔐</h1>
    <p>Hi ${user.name || user.username},</p>
    <p>We detected a new login to your AirLite account. Here are the details:</p>
    <div class="info-box">
      <p><strong>Time:</strong> ${time || new Date().toLocaleString()}</p>
      <p><strong>Device:</strong> ${device || 'Unknown'}</p>
      <p><strong>Location:</strong> ${location || 'Unknown'}</p>
      <p><strong>IP Address:</strong> ${ip || 'Unknown'}</p>
    </div>
    <p>If this was you, you can safely ignore this email.</p>
    <p>If you don't recognize this login, please secure your account immediately:</p>
    <a href="${process.env.FRONTEND_URL}/users/profile/edit" class="button">Secure My Account</a>
    <p>Stay safe,<br>The AirLite Team</p>
  `;
  return baseTemplate(content);
};

/**
 * Listing created template
 */
const listingCreatedTemplate = (user, listing) => {
  const content = `
    <h1>Your Listing is Live! 🏠</h1>
    <p>Hi ${user.name || user.username},</p>
    <p>Congratulations! Your property listing has been successfully created and is now live on AirLite.</p>
    <div class="info-box">
      <p><strong>Property Name:</strong> ${listing.title}</p>
      <p><strong>Location:</strong> ${listing.location || 'N/A'}</p>
      <p><strong>Price:</strong> $${listing.price} per night</p>
      <p><strong>Category:</strong> ${listing.category || 'N/A'}</p>
    </div>
    <p>Your listing is now visible to travelers worldwide. Here's what you can do next:</p>
    <ul style="line-height: 1.8;">
      <li>Monitor your listing performance</li>
      <li>Respond to guest inquiries promptly</li>
      <li>Keep your calendar updated</li>
      <li>Update pricing and availability as needed</li>
    </ul>
    <a href="${process.env.FRONTEND_URL}/listings/${listing._id}" class="button">View Your Listing</a>
    <p>Here's to welcoming your first guests!<br>The AirLite Team</p>
  `;
  return baseTemplate(content);
};

/**
 * Reservation confirmation template
 */
const reservationTemplate = (user, reservation, listing) => {
  const checkIn = new Date(reservation.checkIn).toLocaleDateString('en-US', { 
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
  });
  const checkOut = new Date(reservation.checkOut).toLocaleDateString('en-US', { 
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
  });
  
  const content = `
    <h1>Reservation Confirmed! 📅</h1>
    <p>Hi ${user.name || user.username},</p>
    <p>Great news! Your reservation has been confirmed. Get ready for an amazing stay!</p>
    <div class="info-box">
      <p><strong>Property:</strong> ${listing.title}</p>
      <p><strong>Location:</strong> ${listing.location || 'N/A'}</p>
      <p><strong>Check-in:</strong> ${checkIn}</p>
      <p><strong>Check-out:</strong> ${checkOut}</p>
      <p><strong>Guests:</strong> ${reservation.numberOfGuests || 1}</p>
      <p><strong>Total Nights:</strong> ${reservation.numberOfNights || 1}</p>
      <p><strong>Reservation ID:</strong> ${reservation._id}</p>
    </div>
    <p>Important Information:</p>
    <ul style="line-height: 1.8;">
      <li>Check-in time: After 3:00 PM</li>
      <li>Check-out time: Before 11:00 AM</li>
      <li>You'll receive the host's contact details closer to your check-in date</li>
    </ul>
    <a href="${process.env.FRONTEND_URL}/dashboard/trips" class="button">View Reservation Details</a>
    <p>Have a wonderful trip!<br>The AirLite Team</p>
  `;
  return baseTemplate(content);
};

/**
 * Payment success template
 */
const paymentSuccessTemplate = (user, payment, reservation, listing) => {
  const checkIn = new Date(reservation.checkIn).toLocaleDateString('en-US', { 
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
  });
  const checkOut = new Date(reservation.checkOut).toLocaleDateString('en-US', { 
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
  });

  const content = `
    <h1>Payment Successful! ✅</h1>
    <p>Hi ${user.name || user.username},</p>
    <p>We've successfully received your payment. Your reservation is now fully confirmed!</p>
    
    <h2 style="color: #667eea; font-size: 18px; margin-top: 30px;">Payment Details</h2>
    <div class="info-box">
      <p><strong>Amount Paid:</strong> $${payment.amount || reservation.totalPrice}</p>
      <p><strong>Payment ID:</strong> ${payment.paymentId || payment.razorpay_payment_id || 'N/A'}</p>
      <p><strong>Payment Method:</strong> ${payment.method || 'Card'}</p>
      <p><strong>Transaction Date:</strong> ${new Date().toLocaleDateString('en-US', { 
        year: 'numeric', month: 'long', day: 'numeric' 
      })}</p>
    </div>

    <h2 style="color: #667eea; font-size: 18px; margin-top: 30px;">Reservation Summary</h2>
    <div class="info-box">
      <p><strong>Property:</strong> ${listing.title}</p>
      <p><strong>Location:</strong> ${listing.location || 'N/A'}</p>
      <p><strong>Check-in:</strong> ${checkIn}</p>
      <p><strong>Check-out:</strong> ${checkOut}</p>
      <p><strong>Guests:</strong> ${reservation.numberOfGuests || 1}</p>
      <p><strong>Reservation ID:</strong> ${reservation._id}</p>
    </div>

    <p>What's Next?</p>
    <ul style="line-height: 1.8;">
      <li>You'll receive check-in instructions before your arrival</li>
      <li>The host may reach out with additional details</li>
      <li>Download the receipt from your dashboard</li>
    </ul>

    <a href="${process.env.FRONTEND_URL}/dashboard/trips" class="button">View Trip Details</a>
    
    <hr class="divider">
    <p style="color: #888888; font-size: 14px;">This is your payment confirmation. Please save this email for your records.</p>
    <p>Looking forward to your stay!<br>The AirLite Team</p>
  `;
  return baseTemplate(content);
};

/**
 * Reservation cancelled template
 */
const reservationCancelledTemplate = (user, reservation, listing, refundInfo) => {
  const checkIn = new Date(reservation.checkIn).toLocaleDateString('en-US', { 
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
  });
  
  const content = `
    <h1>Reservation Cancelled 📋</h1>
    <p>Hi ${user.name || user.username},</p>
    <p>Your reservation has been successfully cancelled. Here are the details:</p>
    
    <h2 style="color: #667eea; font-size: 18px; margin-top: 30px;">Cancelled Reservation</h2>
    <div class="info-box">
      <p><strong>Property:</strong> ${listing.title}</p>
      <p><strong>Location:</strong> ${listing.location || 'N/A'}</p>
      <p><strong>Original Check-in:</strong> ${checkIn}</p>
      <p><strong>Reservation ID:</strong> ${reservation._id}</p>
      <p><strong>Cancellation Date:</strong> ${new Date().toLocaleDateString('en-US', { 
        year: 'numeric', month: 'long', day: 'numeric' 
      })}</p>
    </div>

    <h2 style="color: #667eea; font-size: 18px; margin-top: 30px;">Refund Information</h2>
    <div class="info-box">
      <p><strong>Refund Percentage:</strong> ${refundInfo.percentage}%</p>
      <p><strong>Original Amount:</strong> $${reservation.totalPrice}</p>
      <p><strong>Refund Amount:</strong> <span style="color: #22c55e; font-size: 20px; font-weight: bold;">$${refundInfo.amount}</span></p>
      ${refundInfo.amount > 0 ? `<p><strong>Status:</strong> <span style="color: #f59e0b;">Processing</span></p>` : `<p><strong>Status:</strong> <span style="color: #ef4444;">No Refund</span> (Non-refundable policy)</p>`}
    </div>

    ${refundInfo.amount > 0 ? `
    <p>Your refund will be issued to your original payment method within 5-7 business days. You'll receive another email once the refund has been successfully processed.</p>
    ` : `
    <p>Unfortunately, based on the property's cancellation policy, no refund is applicable for your cancellation date.</p>
    `}

    <p>If you have any questions about your cancellation or refund, please contact our support team.</p>
    <p>We hope to welcome you back to AirLite in the future!<br>The AirLite Team</p>
  `;
  return baseTemplate(content);
};

/**
 * Refund initiated template
 */
const refundInitiatedTemplate = (user, reservation, listing, refundInfo) => {
  const content = `
    <h1>Refund Initiated 💰</h1>
    <p>Hi ${user.name || user.username},</p>
    <p>Great news! We've successfully initiated your refund. Here are the details:</p>
    
    <h2 style="color: #667eea; font-size: 18px; margin-top: 30px;">Refund Details</h2>
    <div class="info-box">
      <p><strong>Property:</strong> ${listing.title}</p>
      <p><strong>Reservation ID:</strong> ${reservation._id}</p>
      <p><strong>Refund Amount:</strong> <span style="color: #22c55e; font-size: 18px; font-weight: bold;">$${refundInfo.amount}</span></p>
      <p><strong>Refund Percentage:</strong> ${refundInfo.percentage}%</p>
      <p><strong>Transaction ID:</strong> <code style="background: #f3f4f6; padding: 4px 8px; border-radius: 4px;">${refundInfo.transactionId}</code></p>
    </div>

    <p><strong>Timeline:</strong></p>
    <ul style="line-height: 1.8;">
      <li>✓ Refund has been initiated (Today)</li>
      <li>⏳ Processing by your bank (2-3 business days)</li>
      <li>💳 Amount appears in your account (5-7 business days)</li>
    </ul>

    <p style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; border-radius: 4px;">
      <strong>Note:</strong> The time taken may vary depending on your bank. Some banks process faster than others. If you don't see the refund within 7 business days, please contact us.
    </p>

    <a href="${process.env.FRONTEND_URL}/users/profile/reservation" class="button">Check Reservation Status</a>
    
    <p>Thank you for using AirLite. If you need anything else, we're here to help!<br>The AirLite Team</p>
  `;
  return baseTemplate(content);
};

/**
 * Refund successful template
 */
const refundSuccessfulTemplate = (user, reservation, listing, refundInfo) => {
  const content = `
    <h1>Refund Successful! ✅</h1>
    <p>Hi ${user.name || user.username},</p>
    <p>Excellent news! Your refund has been successfully completed and the amount has been credited to your original payment method.</p>
    
    <h2 style="color: #667eea; font-size: 18px; margin-top: 30px;">Refund Summary</h2>
    <div class="info-box" style="border-left: 4px solid #22c55e;">
      <p><strong>Property:</strong> ${listing.title}</p>
      <p><strong>Reservation ID:</strong> ${reservation._id}</p>
      <p><strong>Refunded Amount:</strong> <span style="color: #22c55e; font-size: 20px; font-weight: bold;">$${refundInfo.amount}</span></p>
      <p><strong>Transaction ID:</strong> <code style="background: #f3f4f6; padding: 4px 8px; border-radius: 4px;">${refundInfo.transactionId}</code></p>
      <p><strong>Refund Completed:</strong> ${new Date().toLocaleDateString('en-US', { 
        year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
      })}</p>
    </div>

    <p>
      <strong>What was refunded?</strong><br>
      Original reservation amount of $${reservation.totalPrice} with a refund percentage of ${refundInfo.percentage}%, resulting in a refund of $${refundInfo.amount}.
    </p>

    <div style="background: #ecfdf5; border-left: 4px solid #22c55e; padding: 12px; border-radius: 4px; margin-top: 20px;">
      <p style="margin: 0; color: #065f46;">
        The refund has been fully processed. If you don't see the amount in your account yet, please check with your bank as processing times may vary.
      </p>
    </div>

    <p style="margin-top: 30px;">
      We hope you'll consider booking with AirLite again in the future. If you have any feedback about your experience, we'd love to hear from you!
    </p>
    
    <p>Best regards,<br>The AirLite Team</p>
  `;
  return baseTemplate(content);
};

/**
 * Refund Failed Email Template
 */
const refundFailedTemplate = (user, reservation, listing, refundInfo) => {
  const content = `
    <div style="text-align: center; padding: 20px 0; border-top: 2px solid #f97316; border-bottom: 2px solid #f97316; margin: 20px 0;">
      <h2 style="color: #dc2626; margin: 0;">⚠️ Refund Processing Failed</h2>
      <p style="margin: 10px 0; color: #666; font-size: 14px;">Reservation ID: ${reservation._id}</p>
    </div>

    <p>Hi <strong>${user.name}</strong>,</p>

    <p>Unfortunately, there was an issue processing your refund for your cancelled reservation at <strong>${listing.title}</strong>.</p>

    <div style="background-color: #fee2e2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0; border-radius: 4px;">
      <p style="margin: 0; color: #991b1b;">
        <strong>Refund Status: Failed</strong><br>
        <span style="font-size: 12px;">Unfortunately, the refund could not be processed at this time.</span>
      </p>
    </div>

    <h3 style="color: #333; font-size: 16px; margin-top: 25px;">What Happened?</h3>
    <p>Our payment processor (Razorpay) was unable to process your refund. This can happen for various reasons, such as:</p>
    <ul style="color: #555; line-height: 1.8;">
      <li>Payment method no longer available or expired</li>
      <li>Bank account restrictions or changes</li>
      <li>Technical issues with the payment processor</li>
      <li>Refund window has passed</li>
    </ul>

    <h3 style="color: #333; font-size: 16px; margin-top: 25px;">What Should You Do?</h3>
    <p>Please contact our support team immediately at <strong>support@airlite.com</strong> with the following information:</p>
    <div style="background-color: #f3f4f6; padding: 15px; border-radius: 4px; margin: 15px 0;">
      <p style="margin: 5px 0;"><strong>Reservation ID:</strong> ${reservation._id}</p>
      <p style="margin: 5px 0;"><strong>Original Amount:</strong> ₹${Number(refundInfo.originalAmount).toLocaleString()}</p>
      <p style="margin: 5px 0;"><strong>Refund Amount:</strong> ₹${Number(refundInfo.amount).toLocaleString()}</p>
      <p style="margin: 5px 0;"><strong>Refund Status:</strong> Failed</p>
    </div>

    <p>Our team will investigate the issue and help you resolve it as quickly as possible. We'll work with you to find an alternative solution for your refund.</p>

    <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px;">
      <p style="margin: 0; color: #92400e;">
        <strong>⏰ Important:</strong> Please reach out to us as soon as possible. Refund windows have time limits and we want to ensure your refund is processed.
      </p>
    </div>

    <p>We sincerely apologize for this inconvenience. We're here to help!</p>
    
    <p>Best regards,<br>The AirLite Support Team</p>
  `;
  return baseTemplate(content);
};

module.exports = {
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
};
