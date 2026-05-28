#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const envFile = path.join(__dirname, "..", ".env");
const envExampleFile = path.join(__dirname, "..", ".env.example");

console.log("🔍 Validating environment...\n");

// Check if .env exists
if (!fs.existsSync(envFile)) {
  console.warn("⚠️  .env file not found");
  if (fs.existsSync(envExampleFile)) {
    console.log("   Copy .env.example to .env and update with your values\n");
  }
}

// Required environment variables for production
const requiredInProduction = ["ADMIN_KEY"];
const optionalButUseful = ["SLACK_WEBHOOK_URL", "MAILCHIMP_API_KEY", "RESEND_API_KEY"];

const isProduction = process.env.NODE_ENV === "production";

if (isProduction) {
  const missing = requiredInProduction.filter(key => !process.env[key]);
  if (missing.length > 0) {
    console.error(`❌ Missing required environment variables: ${missing.join(", ")}`);
    process.exit(1);
  }
  console.log(`✅ All required environment variables present\n`);
}

// Warn about missing optional variables
const missingOptional = optionalButUseful.filter(key => !process.env[key]);
if (missingOptional.length > 0) {
  console.log(`ℹ️  Optional variables not set: ${missingOptional.join(", ")}`);
  console.log("   Set them in .env to enable Slack notifications, Mailchimp sync, or welcome emails\n");
}

console.log("✅ Environment validation passed\n");
