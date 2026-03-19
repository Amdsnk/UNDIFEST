import { db } from "./db";
import { adminUsers } from "../shared/schema";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

async function seedAdmins() {
  console.log("🌱 Seeding admin accounts...");

  const mainAdmin = {
    username: "goodlake",
    password: "best88",
    name: "Super Administrator",
    role: "superadmin" as const,
    isActive: true,
  };

  try {
    const hashedPassword = await bcrypt.hash(mainAdmin.password, 10);

    // Check if admin already exists
    const existing = await db
      .select()
      .from(adminUsers)
      .where(eq(adminUsers.username, mainAdmin.username))
      .limit(1);

    if (existing.length > 0) {
      // Update existing admin password
      await db
        .update(adminUsers)
        .set({ password: hashedPassword, isActive: true })
        .where(eq(adminUsers.username, mainAdmin.username));
      console.log(`🔄 Updated admin: ${mainAdmin.username}`);
    } else {
      // Create new admin
      await db.insert(adminUsers).values({
        username: mainAdmin.username,
        password: hashedPassword,
        name: mainAdmin.name,
        role: mainAdmin.role,
        isActive: mainAdmin.isActive,
      });
      console.log(`✅ Created admin: ${mainAdmin.username} (${mainAdmin.role})`);
    }
  } catch (error) {
    console.error(`❌ Failed to seed admin "${mainAdmin.username}":`, error);
  }

  console.log("\n🎉 Admin seeding completed!");
  console.log("\n📋 Admin Account:");
  console.log("┌──────────┬──────────┬─────────────┐");
  console.log("│ Username │ Password │ Role        │");
  console.log("├──────────┼──────────┼─────────────┤");
  console.log("│ goodlake │ best88   │ Superadmin  │");
  console.log("└──────────┴──────────┴─────────────┘");
  console.log("\n🔐 You can now login with these credentials!");
}

// Run the seed function
seedAdmins()
  .then(() => {
    console.log("\n✨ Seed script finished successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Seed script failed:", error);
    process.exit(1);
  });

