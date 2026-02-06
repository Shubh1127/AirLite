const nodemailer = require('nodemailer');

// Create a transporter object using SMTP transport
const createTransporter = () => {
  return nodemailer.createTransport({
    service: process.env.MAIL_SERVICE || 'gmail', // You can use other services like SendGrid, Mailgun, etc.
    host: process.env.MAIL_HOST || 'smtp.gmail.com',
    port: process.env.MAIL_PORT || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.MAIL_USER, // Your email address
      pass: process.env.MAIL_PASSWORD, // Your email password or app password
    },
  });
};

module.exports = createTransporter;
