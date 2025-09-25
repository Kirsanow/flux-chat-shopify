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
    path: '.env.local',
    optional: true, // Mark as optional since it might not exist
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
  },
  {
    path: 'app/lib/config.server.ts',
    optional: true,
    updates: [
      // Update the fallback URLs in config.server.ts
      { pattern: /process\.env\.NGROK_URL \|\| 'https:\/\/[^']+'/g, replacement: `process.env.NGROK_URL || '${newUrl}'` },
      { pattern: /process\.env\.SHOPIFY_APP_URL \|\| process\.env\.NGROK_URL \|\| 'https:\/\/[^']+'/g, replacement: `process.env.SHOPIFY_APP_URL || process.env.NGROK_URL || '${newUrl}'` }
    ]
  }
];

// Update each file
filesToUpdate.forEach(file => {
  const filePath = path.join(__dirname, '..', file.path);

  if (!fs.existsSync(filePath)) {
    if (file.optional) {
      console.log(`⏭️  Skipping optional file: ${file.path}`);
    } else {
      console.warn(`⚠️  File not found: ${file.path}`);
    }
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  let changesMade = false;

  file.updates.forEach(update => {
    const oldContent = content;
    content = content.replace(update.pattern, update.replacement);
    if (oldContent !== content) {
      changesMade = true;
    }
  });

  if (changesMade) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Updated: ${file.path}`);
  } else {
    console.log(`✔️  Already up to date: ${file.path}`);
  }
});

// Additional cleanup and synchronization
console.log('\n🧹 Performing additional cleanup...');

// Function to clean duplicate env vars from .env file
function cleanupEnvFile() {
  const envPath = path.join(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) return;

  let content = fs.readFileSync(envPath, 'utf8');
  const lines = content.split('\n');
  const seen = new Set();
  const cleaned = [];

  // Process from the beginning, keeping first occurrence
  for (const line of lines) {
    if (line.trim() === '' || line.startsWith('#')) {
      cleaned.push(line);
    } else {
      const key = line.split('=')[0];
      if (key && !seen.has(key)) {
        seen.add(key);
        cleaned.push(line);
      }
    }
  }

  const cleanedContent = cleaned.join('\n');
  if (cleanedContent !== content) {
    fs.writeFileSync(envPath, cleanedContent, 'utf8');
    console.log('✅ Cleaned up duplicate environment variables');
  }
}

// Function to sync API keys from .env.local to .env if missing
function syncApiKeys() {
  const envPath = path.join(__dirname, '..', '.env');
  const envLocalPath = path.join(__dirname, '..', '.env.local');

  if (!fs.existsSync(envLocalPath) || !fs.existsSync(envPath)) return;

  const envLocal = fs.readFileSync(envLocalPath, 'utf8');
  let env = fs.readFileSync(envPath, 'utf8');

  // Extract API keys from .env.local
  const openaiMatch = envLocal.match(/OPENAI_API_KEY=(.+)/);
  const anthropicMatch = envLocal.match(/ANTHROPIC_API_KEY=(.+)/);
  const supabaseServiceMatch = envLocal.match(/SUPABASE_SERVICE_KEY=(.+)/);

  let updated = false;

  if (openaiMatch && openaiMatch[1] && !env.match(/OPENAI_API_KEY=.+/)) {
    env = env.replace(/OPENAI_API_KEY=/, `OPENAI_API_KEY=${openaiMatch[1]}`);
    updated = true;
  }

  if (anthropicMatch && anthropicMatch[1] && !env.match(/ANTHROPIC_API_KEY=.+/)) {
    env = env.replace(/ANTHROPIC_API_KEY=/, `ANTHROPIC_API_KEY=${anthropicMatch[1]}`);
    updated = true;
  }

  if (supabaseServiceMatch && supabaseServiceMatch[1] && !env.match(/SUPABASE_SERVICE_KEY=.+/)) {
    env = env.replace(/SUPABASE_SERVICE_KEY=/, `SUPABASE_SERVICE_KEY=${supabaseServiceMatch[1]}`);
    updated = true;
  }

  if (updated) {
    fs.writeFileSync(envPath, env, 'utf8');
    console.log('✅ Synchronized API keys from .env.local');
  }
}

cleanupEnvFile();
syncApiKeys();

console.log(`
✨ ngrok URL updated successfully!

🔄 All files updated:
  • .env (main configuration)
  • .env.local (if exists)
  • shopify.app.toml (Shopify configuration)
  • app/lib/config.server.ts (fallback URLs)
  • Cleaned duplicate environment variables
  • Synchronized API keys

Next steps:
1. Restart your dev server: bun run dev
2. Deploy the changes: bun run deploy

Your app will now use: ${newUrl}
`);