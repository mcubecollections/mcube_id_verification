const nodemailer = require("nodemailer");
const config = require("./config");

function createTransport() {
  // Check if using Gmail - use optimized service configuration
  const isGmail = config.email.host && config.email.host.toLowerCase().includes('gmail');
  
  if (isGmail) {
    // Use Gmail service with extended timeouts for reliable delivery
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: config.email.user,
        pass: config.email.pass,
      },
      // Extended timeouts for slow/restricted networks (e.g., Render)
      connectionTimeout: 60000, // 60 seconds
      greetingTimeout: 30000,   // 30 seconds
      socketTimeout: 60000,     // 60 seconds
      pool: false, // Don't use connection pooling to avoid timeout issues
    });
  }
  
  // For other SMTP servers, use manual configuration
  return nodemailer.createTransport({
    host: config.email.host,
    port: config.email.port,
    secure: config.email.secure,
    auth: {
      user: config.email.user,
      pass: config.email.pass,
    },
    tls: {
      rejectUnauthorized: false,
    },
    connectionTimeout: 60000,
    greetingTimeout: 30000,
    socketTimeout: 60000,
    pool: false,
  });
}

/**
 * Send email with retry logic
 * @param {Object} transporter - Nodemailer transporter
 * @param {Object} mailOptions - Email options
 * @param {number} retries - Number of retries left
 * @returns {Promise} - Send result
 */
async function sendMailWithRetry(transporter, mailOptions, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`[Email] Attempting to send (attempt ${attempt}/${retries})...`);
      const info = await transporter.sendMail(mailOptions);
      console.log(`[Email] Successfully sent to: ${mailOptions.to}`);
      console.log(`[Email] Message ID: ${info.messageId}`);
      return info;
    } catch (error) {
      console.error(`[Email] Attempt ${attempt}/${retries} failed:`, error.message);
      
      if (attempt === retries) {
        throw error; // Rethrow on last attempt
      }
      
      // Wait before retrying (exponential backoff)
      const waitTime = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
      console.log(`[Email] Retrying in ${waitTime}ms...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
}

/**
 * Verify email transporter connection
 * @param {Object} transporter - Nodemailer transporter
 * @returns {Promise<boolean>} - Connection status
 */
async function verifyConnection(transporter) {
  try {
    console.log('[Email] Verifying SMTP connection...');
    await transporter.verify();
    console.log('[Email] SMTP connection verified successfully');
    return true;
  } catch (error) {
    console.error('[Email] SMTP connection verification failed:', error.message);
    return false;
  }
}

async function sendKycSuccessEmail(data) {
  const recipients = config.email.recipients;
  if (!recipients || recipients.length === 0) {
    console.warn('[Email] No recipients configured for KYC success emails');
    return;
  }

  if (!config.email.host || !config.email.user || !config.email.from) {
    console.warn(
      "[Email] Configuration is incomplete; skipping KYC success email send."
    );
    return;
  }

  console.log(`[Email] Preparing to send KYC success email to: ${recipients.join(', ')}`);

  const transporter = createTransport();

  // Verify connection first
  const isConnected = await verifyConnection(transporter);
  if (!isConnected) {
    console.warn('[Email] Skipping email send due to connection failure');
    return;
  }

  const name = data.name || "Unknown";
  const email = data.email || "";
  const sessionId = data.sessionId || "";

  const subject = `KYC selfie verification success: ${name}`;

  const textLines = [
    "A user has successfully completed KYC selfie verification.",
    "",
    `Name: ${name}`,
    `Email: ${email}`,
    `Session ID: ${sessionId}`,
    `Status: ${data.status || "approved"}`,
    `Completed At: ${new Date().toISOString()}`,
  ];

  const htmlParts = [
    "<p>A user has successfully completed KYC selfie verification.</p>",
    "<ul>",
    `<li><strong>Name:</strong> ${name}</li>`,
    `<li><strong>Email:</strong> ${email}</li>`,
    `<li><strong>Session ID:</strong> ${sessionId}</li>`,
    `<li><strong>Status:</strong> ${data.status || "approved"}</li>`,
    `<li><strong>Completed At:</strong> ${new Date().toISOString()}</li>`,
    "</ul>",
  ];

  const mailOptions = {
    from: config.email.from,
    to: recipients.join(', '), // Ensure proper comma-separated format
    subject,
    text: textLines.join("\n"),
    html: htmlParts.join(""),
  };

  await sendMailWithRetry(transporter, mailOptions, 3);
}

module.exports = {
  sendKycSuccessEmail,
};
