#!/usr/bin/env node
/**
 * Test script to verify email configuration and delivery
 * Run with: node test-email.js
 */

require('dotenv').config();
const emailService = require('./src/emailService');
const config = require('./src/config');

async function testEmailService() {
  console.log('\n========================================');
  console.log('Email Service Test');
  console.log('========================================\n');

  // Display current email configuration
  console.log('Current Email Configuration:');
  console.log('----------------------------');
  console.log(`Host: ${config.email.host}`);
  console.log(`Port: ${config.email.port}`);
  console.log(`Secure: ${config.email.secure}`);
  console.log(`User: ${config.email.user}`);
  console.log(`From: ${config.email.from}`);
  console.log(`Recipients: ${config.email.recipients.join(', ')}`);
  console.log('\n');

  if (!config.email.recipients || config.email.recipients.length === 0) {
    console.error('❌ ERROR: No recipients configured!');
    console.log('Please set KYC_SUCCESS_RECIPIENTS in your .env file');
    process.exit(1);
  }

  if (!config.email.host || !config.email.user || !config.email.pass) {
    console.error('❌ ERROR: Email configuration incomplete!');
    console.log('Please ensure EMAIL_HOST, EMAIL_USER, and EMAIL_PASS are set');
    process.exit(1);
  }

  // Test email send
  console.log('Attempting to send test email...\n');

  try {
    await emailService.sendKycSuccessEmail({
      name: 'Test User',
      email: 'test@example.com',
      sessionId: 'test-session-' + Date.now(),
      status: 'approved',
    });

    console.log('\n✅ SUCCESS: Email sent successfully!');
    console.log('Check the recipient inboxes to confirm delivery.');
  } catch (error) {
    console.error('\n❌ FAILED: Email send failed');
    console.error('Error:', error.message);
    console.error('\nFull error details:');
    console.error(error);
    process.exit(1);
  }
}

testEmailService();
