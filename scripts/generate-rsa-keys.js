/**
 * Generate RSA Key Pair for DOKU Snap API
 * Run: node scripts/generate-rsa-keys.js
 */

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔐 Generating RSA Key Pair for DOKU Snap API...\n');

// Generate RSA key pair (2048 bits)
const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: {
    type: 'spki',
    format: 'pem'
  },
  privateKeyEncoding: {
    type: 'pkcs8',
    format: 'pem'
  }
});

// Create keys directory if not exists
const keysDir = path.join(path.dirname(__dirname), 'keys');
if (!fs.existsSync(keysDir)) {
  fs.mkdirSync(keysDir, { recursive: true });
}

// Save private key
const privateKeyPath = path.join(keysDir, 'doku-private-key.pem');
fs.writeFileSync(privateKeyPath, privateKey);
console.log('✅ Private Key saved to:', privateKeyPath);

// Save public key
const publicKeyPath = path.join(keysDir, 'doku-public-key.pem');
fs.writeFileSync(publicKeyPath, publicKey);
console.log('✅ Public Key saved to:', publicKeyPath);

console.log('\n📋 Next Steps:');
console.log('1. Copy the PUBLIC KEY below and upload to DOKU Dashboard');
console.log('2. Go to: https://dashboard.doku.com/bo/developer/api-keys');
console.log('3. Click "Edit Merchant Public Key" button');
console.log('4. Paste the public key and save');
console.log('5. Add DOKU_PRIVATE_KEY to Railway environment variables\n');

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('📄 PUBLIC KEY (Upload to DOKU Dashboard):');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(publicKey);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

console.log('\n🔒 PRIVATE KEY (Add to Railway as DOKU_PRIVATE_KEY):');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(privateKey);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

console.log('\n⚠️  IMPORTANT: Keep the private key SECRET! Do NOT commit to Git!');
console.log('✅ The keys/ directory is already in .gitignore\n');

