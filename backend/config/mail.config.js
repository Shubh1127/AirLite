const sgMail = require('@sendgrid/mail');

// Initialize SendGrid with API key
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

/**
 * SendGrid mail transporter
 * Returns an object with sendMail method compatible with nodemailer interface
 */
const createTransporter = () => {
  return {
    sendMail: async (mailOptions) => {
      try {
        // Use SendGrid's send method
        const msg = {
          to: mailOptions.to,
          from: mailOptions.from,
          subject: mailOptions.subject,
          text: mailOptions.text,
          html: mailOptions.html,
        };

        const result = await sgMail.send(msg);
        
        // Return result in nodemailer format
        return {
          messageId: result[0].headers['x-message-id'],
          response: result[0].statusCode,
        };
      } catch (error) {
        throw error;
      }
    },
  };
};

module.exports = createTransporter;
