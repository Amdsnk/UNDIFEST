import { db } from "./db";
import { adminUsers } from "../shared/schema";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

async function seedAdmins() {
  console.log("🌱 Seeding admin accounts...");

  const testAdmins = [
    {
      username: "superadmin",
      password: "admin123",
      name: "Super Administrator",
      role: "superadmin" as const,
      isActive: true,
    },
    {
      username: "qscustom",
      password: "admin123",
      name: "QS Custom Admin",
      role: "qs_custom" as const,
      isActive: true,
    },
    {
      username: "viewer",
      password: "admin123",
      name: "Viewer Admin",
      role: "viewer" as const,
      isActive: true,
    },
  ];

  for (const admin of testAdmins) {
    try {
      // Check if admin already exists
      const existing = await db
        .select()
        .from(adminUsers)
        .where(eq(adminUsers.username, admin.username))
        .limit(1);

      if (existing.length > 0) {
        console.log(`⏭️  Admin "${admin.username}" already exists, skipping...`);
        continue;
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(admin.password, 10);

      // Create admin
      await db.insert(adminUsers).values({
        username: admin.username,
        password: hashedPassword,
        name: admin.name,
        role: admin.role,
        isActive: admin.isActive,
      });

      console.log(`✅ Created admin: ${admin.username} (${admin.role})`);
    } catch (error) {
      console.error(`❌ Failed to create admin "${admin.username}":`, error);
    }
  }

  console.log("\n🎉 Admin seeding completed!");
  console.log("\n📋 Test Admin Accounts:");
  console.log("┌─────────────┬──────────┬─────────────┐");
  console.log("│ Username    │ Password │ Role        │");
  console.log("├─────────────┼──────────┼─────────────┤");
  console.log("│ superadmin  │ admin123 │ Superadmin  │");
  console.log("│ qscustom    │ admin123 │ QS Custom   │");
  console.log("│ viewer      │ admin123 │ Viewer      │");
  console.log("└─────────────┴──────────┴─────────────┘");
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

