import { db } from "../server/db.js";
import { banners } from "../shared/schema.js";
import { eq } from "drizzle-orm";

async function deleteWrongBanners() {
  try {
    console.log('\n🗑️  Deleting wrong banners (base64 images)...\n');

    // Get all banners first
    const allBanners = await db.select().from(banners);

    // Delete all banners with base64 imageUrl
    for (const banner of allBanners) {
      if (banner.imageUrl.startsWith('data:image')) {
        await db.delete(banners).where(eq(banners.id, banner.id));
        console.log(`✓ Deleted base64 banner: ${banner.id}`);
      }
    }
    
    console.log('\n✅ Cleanup complete!\n');

    // Show remaining banners
    const remainingBanners = await db.select().from(banners);
    console.log('📋 Remaining banners:\n');
    remainingBanners.forEach((b, i) => {
      console.log(`${i+1}. Order: ${b.order}`);
      console.log(`   URL: ${b.imageUrl.substring(0, 60)}...`);
      console.log('');
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

deleteWrongBanners();

