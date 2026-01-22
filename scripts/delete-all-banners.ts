import { db } from "../server/db.js";
import { banners } from "../shared/schema.js";
import { sql } from "drizzle-orm";

async function deleteAllBanners() {
  try {
    console.log('\n🗑️  Deleting ALL banners...\n');
    
    await db.delete(banners);
    
    console.log('✅ All banners deleted!\n');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

deleteAllBanners();

