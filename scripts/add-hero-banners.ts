import { db } from "../server/db.js";
import { banners } from "../shared/schema.js";
import path from "path";
import fs from "fs";

async function addHeroBanners() {
  try {
    console.log("Adding hero banners to database...");

    // Check if banners already exist
    const existingBanners = await db.select().from(banners);
    console.log(`Found ${existingBanners.length} existing banners`);

    // Banner 2 - Blue banner
    const banner2Path = path.join(process.cwd(), "attached_assets", "banner undifest2.jpg");
    if (!fs.existsSync(banner2Path)) {
      console.error(`Banner 2 not found at: ${banner2Path}`);
    } else {
      const banner2Url = "/attached_assets/banner undifest2.jpg";
      await db.insert(banners).values({
        title: "Hero Banner 2",
        imageUrl: banner2Url,
        order: 2,
        isActive: true,
      });
      console.log("✓ Added Banner 2 (Blue)");
    }

    // Banner 3 - Orange banner
    const banner3Path = path.join(process.cwd(), "attached_assets", "banner undifest3.jpg");
    if (!fs.existsSync(banner3Path)) {
      console.error(`Banner 3 not found at: ${banner3Path}`);
    } else {
      const banner3Url = "/attached_assets/banner undifest3.jpg";
      await db.insert(banners).values({
        title: "Hero Banner 3",
        imageUrl: banner3Url,
        order: 3,
        isActive: true,
      });
      console.log("✓ Added Banner 3 (Orange)");
    }

    console.log("\n✅ Hero banners added successfully!");
    
    // Show all banners
    const allBanners = await db.select().from(banners);
    console.log("\nAll banners in database:");
    allBanners.forEach((banner) => {
      console.log(`  - ${banner.title} (Order: ${banner.order}, Active: ${banner.isActive})`);
    });

  } catch (error) {
    console.error("Error adding hero banners:", error);
    process.exit(1);
  }
}

addHeroBanners();

