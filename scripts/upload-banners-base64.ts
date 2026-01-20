import { db } from "../server/db.js";
import { banners } from "../shared/schema.js";
import fs from "fs";
import path from "path";

async function uploadBannersAsBase64() {
  try {
    console.log('\n📤 Converting and uploading banners as base64...\n');
    
    const bannersToUpload = [
      {
        path: path.join(process.cwd(), "attached_assets", "banner undifest2.jpg"),
        title: "Hero Banner 2",
        order: 1,
      },
      {
        path: path.join(process.cwd(), "attached_assets", "banner undifest3.jpg"),
        title: "Hero Banner 3",
        order: 2,
      }
    ];
    
    for (const banner of bannersToUpload) {
      if (!fs.existsSync(banner.path)) {
        console.log(`❌ File not found: ${banner.path}`);
        continue;
      }
      
      // Read file and convert to base64
      const fileBuffer = fs.readFileSync(banner.path);
      const base64 = fileBuffer.toString('base64');
      const mimeType = 'image/jpeg';
      const base64Url = `data:${mimeType};base64,${base64}`;
      
      // Insert to database
      await db.insert(banners).values({
        title: banner.title,
        imageUrl: base64Url,
        order: banner.order,
        isActive: true,
      });
      
      console.log(`✓ Uploaded ${banner.title} (Order: ${banner.order})`);
      console.log(`  Size: ${(base64.length / 1024).toFixed(2)} KB`);
    }
    
    console.log('\n✅ All banners uploaded!\n');
    
    // Show all banners
    const allBanners = await db.select().from(banners);
    console.log('📋 All banners in database:\n');
    allBanners.forEach((b, i) => {
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

uploadBannersAsBase64();

