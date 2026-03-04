// Script untuk cek IP Railway Production
// Jalankan: node check-railway-ip.js

const https = require('https');

// Ganti dengan URL Railway production Anda
const RAILWAY_URL = process.argv[2] || 'https://your-app.railway.app';

console.log('\n🔍 Checking Railway Production IP...\n');
console.log(`Railway URL: ${RAILWAY_URL}\n`);

const url = `${RAILWAY_URL}/api/server-ip`;

https.get(url, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const result = JSON.parse(data);
      console.log('✅ Success!\n');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`📍 IP Outbound Railway: ${result.outboundIP}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      console.log('📋 Berikan IP ini ke DOKU Support untuk whitelist\n');
    } catch (error) {
      console.error('❌ Error parsing response:', error.message);
      console.log('Raw response:', data);
    }
  });
}).on('error', (error) => {
  console.error('❌ Error:', error.message);
  console.log('\n💡 Cara menggunakan:');
  console.log('   node check-railway-ip.js https://your-app.railway.app\n');
});

