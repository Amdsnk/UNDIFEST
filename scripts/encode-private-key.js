/**
 * Encode private key to base64 for Railway environment variable
 * Run: node scripts/encode-private-key.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const privateKeyPath = path.join(path.dirname(__dirname), 'keys', 'doku-private-key.pem');

if (!fs.existsSync(privateKeyPath)) {
  console.error('❌ Private key file not found:', privateKeyPath);
  console.log('Please run: node scripts/generate-rsa-keys.js first');
  process.exit(1);
}

const privateKey = fs.readFileSync(privateKeyPath, 'utf8');
const base64Encoded = Buffer.from(privateKey).toString('base64');

console.log('✅ Private key encoded to base64\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('📋 Add this to Railway as DOKU_PRIVATE_KEY_BASE64:');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(base64Encoded);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

console.log('📝 Then update server/doku.ts to decode it:');
console.log('const DOKU_PRIVATE_KEY = process.env.DOKU_PRIVATE_KEY_BASE64');
console.log('  ? Buffer.from(process.env.DOKU_PRIVATE_KEY_BASE64, "base64").toString("utf8")');
console.log('  : process.env.DOKU_PRIVATE_KEY || "";');

