#!/usr/bin/env node

/**
 * Script to update ngrok URL across the application
 * Usage: node scripts/update-ngrok.js <new-ngrok-url>
 * Example: node scripts/update-ngrok.js https://abc123.ngrok-free.app
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const newUrl = process.argv[2];

if (!newUrl) {
  console.error('❌ Please provide a ngrok URL');
  console.error('Usage: node scripts/update-ngrok.js <new-ngrok-url>');
  console.error('Example: node scripts/update-ngrok.js https://abc123.ngrok-free.app');
  process.exit(1);
}

// Validate URL format
if (!newUrl.startsWith('https://') || !newUrl.includes('.ngrok')) {
  console.error('❌ Invalid ngrok URL format');
  console.error('URL should be like: https://abc123.ngrok-free.app');
  process.exit(1);
}

console.log(`🔄 Updating ngrok URL to: ${newUrl}`);

// Files to update
const filesToUpdate = [
  {
    path: '.env',
    updates: [
      { pattern: /NGROK_URL=.*/g, replacement: `NGROK_URL=${newUrl}` },
      { pattern: /SHOPIFY_APP_URL=.*/g, replacement: `SHOPIFY_APP_URL=${newUrl}` }
    ]
  },
  {
    path: 'shopify.app.toml',
    updates: [
      { pattern: /application_url = "https:\/\/[^"]+"/g, replacement: `application_url = "${newUrl}"` },
      { pattern: /redirect_urls = \[.*?\]/gs, replacement: `redirect_urls = ["${newUrl}/auth/callback", "${newUrl}/auth/shopify/callback", "${newUrl}/api/auth/callback"]` },
      { pattern: /url = "https:\/\/[^"]+"/g, replacement: `url = "${newUrl}"` }
    ]
  }
];

// Update each file
filesToUpdate.forEach(file => {
  const filePath = path.join(__dirname, '..', file.path);

  if (!fs.existsSync(filePath)) {
    console.warn(`⚠️  File not found: ${file.path}`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');

  file.updates.forEach(update => {
    content = content.replace(update.pattern, update.replacement);
  });

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`✅ Updated: ${file.path}`);
});

console.log(`
✨ ngrok URL updated successfully!

Next steps:
1. Restart your dev server: bun run dev
2. Deploy the changes: bun run deploy

Your app will now use: ${newUrl}
`);