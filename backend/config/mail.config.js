const nodemailer = require('nodemailer');

// Create a transporter object using SMTP transport
const createTransporter = () => {
  return nodemailer.createTransport({
    service: process.env.MAIL_SERVICE || 'gmail',
    host: process.env.MAIL_HOST || 'smtp.gmail.com',
    port: process.env.MAIL_PORT || 465, // Use 465 for SSL (more reliable)
    secure: true, // true for 465 (SSL), false for 587 (TLS)
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASSWORD,
    },
    connectionUrl: process.env.MAIL_CONNECTION_URL,
    // Connection pooling and retry configuration
    pool: {
      maxConnections: 5,
      maxMessages: 100,
      rateDelta: 4000,
      rateLimit: 14,
    },
    connectionTimeout: 10000, // 10 seconds
    socketTimeout: 10000, // 10 seconds
    greetingTimeout: 10000, // 10 seconds
    logger: true, // Enable logging
    debug: process.env.NODE_ENV === 'development', // Debug in development
  });
};

module.exports = createTransporter;
