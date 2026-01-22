import { db } from "./db";
import { adminUsers } from "../shared/schema";
import { eq } from "drizzle-orm";

async function updateAdminRole() {
  console.log("🔧 Updating admin role to superadmin...\n");

  try {
    // Check if 'admin' user exists
    const existingAdmin = await db
      .select()
      .from(adminUsers)
      .where(eq(adminUsers.username, "admin"))
      .limit(1);

    if (existingAdmin.length === 0) {
      console.log("❌ Admin user 'admin' not found!");
      console.log("💡 Try running: npm run seed:admins");
      process.exit(1);
    }

    // Update admin role to superadmin
    await db
      .update(adminUsers)
      .set({
        role: "superadmin",
        name: "Super Administrator",
        isActive: true,
      })
      .where(eq(adminUsers.username, "admin"));

    console.log("✅ Successfully updated admin role!");
    console.log("\n📋 Login Credentials:");
    console.log("┌──────────┬──────────┬─────────────┐");
    console.log("│ Username │ Password │ Role        │");
    console.log("├──────────┼──────────┼─────────────┤");
    console.log("│ admin    │ admin123 │ Superadmin  │");
    console.log("└──────────┴──────────┴─────────────┘");
    console.log("\n🔐 You can now login as superadmin!");

  } catch (error) {
    console.error("❌ Failed to update admin role:", error);
    process.exit(1);
  }
}

// Run the update function
updateAdminRole()
  .then(() => {
    console.log("\n✨ Update completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Update failed:", error);
    process.exit(1);
  });

