import { db } from "../server/db.js";
import { banners } from "../shared/schema.js";
import fs from "fs";
import path from "path";

async function addThirdBanner() {
  try {
    console.log('\n📤 Adding third banner...\n');
    
    const bannerPath = path.join(process.cwd(), "attached_assets", "banner01_1763476399982.jpg");
    
    if (!fs.existsSync(bannerPath)) {
      console.log(`❌ File not found: ${bannerPath}`);
      process.exit(1);
    }
    
    // Read file and convert to base64
    const fileBuffer = fs.readFileSync(bannerPath);
    const base64 = fileBuffer.toString('base64');
    const mimeType = 'image/jpeg';
    const base64Url = `data:${mimeType};base64,${base64}`;
    
    // Insert to database
    await db.insert(banners).values({
      title: "Hero Banner 1",
      imageUrl: base64Url,
      order: 0,
      isActive: true,
    });
    
    console.log(`✓ Uploaded Hero Banner 1 (Order: 0)`);
    console.log(`  Size: ${(base64.length / 1024).toFixed(2)} KB`);
    
    console.log('\n✅ Banner added!\n');
    
    // Show all banners
    const allBanners = await db.select().from(banners);
    console.log('📋 All banners in database:\n');
    allBanners.sort((a, b) => a.order - b.order).forEach((b, i) => {
      console.log(`${i+1}. Title: ${b.title || 'N/A'}`);
      console.log(`   Order: ${b.order}`);
      console.log(`   Type: ${b.imageUrl.startsWith('data:') ? 'Base64' : 'URL'}`);
      console.log('');
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

addThirdBanner();

