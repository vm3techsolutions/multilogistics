const nodemailer = require("nodemailer");

/**
 * Create a reusable transporter using EMAIL_* env variables
 */
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT || 587,
  secure: false, // use true for port 465
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

// Verify transporter
transporter.verify((error, success) => {
  if (error) {
    console.error(" Email transporter connection failed:", error);
  } else {
    // console.log("✅ Email transporter is ready to send emails");
  }
});

/**
 * Reusable send email function
 * @param {string|string[]} to - recipient(s)
 * @param {string} subject - email subject
 * @param {string} html - HTML content
 * @param {string} [text] - optional plain text
 * @param {Array} [attachments] - optional attachments
 */
const sendEmail = async ({ to, subject, html, text, attachments }) => {
  try {
    const info = await transporter.sendMail({
      from: `Your Company <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
      text,
      attachments,
    });

    console.log(`📩 Email sent successfully to: ${to}`);
    return info;
  } catch (error) {
    console.error(" Email sending failed:", error.message);
    throw error;
  }
};

module.exports = { sendEmail };
