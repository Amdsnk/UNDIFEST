import { db } from "../server/db.js";
import { banners } from "../shared/schema.js";

async function checkBanners() {
  try {
    const allBanners = await db.select().from(banners);
    console.log('\n📋 All banners in database:\n');
    allBanners.forEach((b, i) => {
      console.log(`${i+1}. ID: ${b.id}`);
      console.log(`   Title: ${b.title || 'N/A'}`);
      console.log(`   Order: ${b.order}`);
      console.log(`   URL: ${b.imageUrl}`);
      console.log(`   Active: ${b.isActive}`);
      console.log('');
    });
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkBanners();

