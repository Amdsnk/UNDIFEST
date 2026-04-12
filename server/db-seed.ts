import { db } from "./db";
import {
  adminUsers,
  events,
  banners,
  users,
  transactions,
  videos,
  manualWinnerHistory,
} from "@shared/schema";
import { hashPassword } from "./auth";

export async function seedDatabase() {
  try {
    console.log("🌱 Seeding database...");

    // Check if admin user already exists
    const existingAdmins = await db.select().from(adminUsers).limit(1);
    if (existingAdmins.length > 0) {
      console.log("✓ Database already seeded, skipping...");
      return;
    }

    // Create admin user with hashed password
    const hashedPassword = await hashPassword("best88");
    const [admin] = await db.insert(adminUsers).values({
      username: "goodlake",
      password: hashedPassword,
    }).returning();
    console.log("✓ Created admin user (username: goodlake)");

    // Create banners
    await db.insert(banners).values([
      {
        imageUrl: "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=1200",
        order: 1,
      },
    ]);
    console.log("✓ Created banners");

    // Create sample events
    const [event1] = await db.insert(events).values({
      name: "Cheeseburger + Cheeseburger XL\n100% Flame Grilled by Burger King",
      imageUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800",
      description: "Beli e-book senilai Rp 10.000 untuk mendapatkan 1 tiket undian dengan hadiah voucher Burger King untuk 10 pemenang.",
      price: 10000,
      ticketCount: 100,
      prize: "Voucher Cheeseburger + Cheeseburger XL Burger King untuk 10 pemenang",
      hadiah: 90000,
      startDate: new Date("2025-02-01"),
      endDate: new Date("2025-02-28"),
      announcementDate: new Date("2025-03-01T19:00:00"),
      status: "aktif",
      category: "food",
    }).returning();

    const [event2] = await db.insert(events).values({
      name: "All New Yamaha NMAX 155 cc\nDengan teknologi Blue Core & VVA",
      imageUrl: "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=800",
      description: "Kesempatan emas mendapatkan motor impian Anda! Beli e-book senilai Rp 100.000 untuk 1 tiket undian.",
      price: 100000,
      ticketCount: 50,
      prize: "All New Yamaha NMAX 155 cc",
      hadiah: 2000000,
      startDate: new Date("2025-02-10"),
      endDate: new Date("2025-03-31"),
      announcementDate: new Date("2025-04-05T19:00:00"),
      status: "aktif",
      category: "other",
    }).returning();

    await db.insert(events).values({
      name: "iPhone 15 Pro Max 256GB\nLimited Edition",
      imageUrl: "https://images.unsplash.com/photo-1696446702061-cbd8c8e0c4d3?w=800",
      description: "Dapatkan iPhone terbaru dengan kesempatan menang fantastis!",
      price: 50000,
      ticketCount: 100,
      prize: "iPhone 15 Pro Max 256GB",
      hadiah: 100000,
      startDate: new Date("2025-01-15"),
      endDate: new Date("2025-07-31"),
      announcementDate: new Date("2025-08-05T19:00:00"),
      status: "selesai",
      category: "other",
    });
    console.log("✓ Created events");

    // Create sample users with complete data
    const [user1] = await db.insert(users).values({
      phoneNumber: "081332771234",
      name: "Udin",
      city: "Padang",
      email: "udin99@gmail.com",
      ip: "192.168.1.1",
      isActive: true,
    }).returning();

    const [user2] = await db.insert(users).values({
      phoneNumber: "082891454578",
      name: "Andre",
      city: "Pontianak",
      email: "Andre22@gmail.com",
      ip: "192.168.2.5",
      isActive: true,
    }).returning();

    const [user3] = await db.insert(users).values({
      phoneNumber: "087712345678",
      name: "Tono",
      city: "Brebes",
      email: "tonox@gmail.com",
      ip: "203.45.67.89",
      isActive: false,
    }).returning();

    const [user4] = await db.insert(users).values({
      phoneNumber: "081298765432",
      name: "Geri",
      city: "Denpasar",
      email: "Geri13@gmail.com",
      ip: "110.23.45.67",
      isActive: false,
    }).returning();

    const [user5] = await db.insert(users).values({
      phoneNumber: "085612349876",
      name: "Siti",
      city: "Jakarta",
      email: "siti.rahmawati@gmail.com",
      ip: "182.34.56.78",
      isActive: true,
    }).returning();
    console.log("✓ Created sample users");

    // Create sample transactions
    await db.insert(transactions).values([
      {
        userId: user1.id,
        eventId: event1.id,
        amount: 10000,
        ticketCount: 5,
        phoneNumber: user1.phoneNumber,
        eventName: event1.name,
      },
      {
        userId: user2.id,
        eventId: event1.id,
        amount: 70000,
        ticketCount: 7,
        phoneNumber: user2.phoneNumber,
        eventName: event1.name,
      },
      {
        userId: user3.id,
        eventId: event2.id,
        amount: 100000,
        ticketCount: 1,
        phoneNumber: user3.phoneNumber,
        eventName: event2.name,
      },
      {
        userId: user4.id,
        eventId: event1.id,
        amount: 10000,
        ticketCount: 1,
        phoneNumber: user4.phoneNumber,
        eventName: event1.name,
      },
      {
        userId: user5.id,
        eventId: event2.id,
        amount: 300000,
        ticketCount: 3,
        phoneNumber: user5.phoneNumber,
        eventName: event2.name,
      },
      {
        userId: user1.id,
        eventId: event2.id,
        amount: 100000,
        ticketCount: 1,
        phoneNumber: user1.phoneNumber,
        eventName: event2.name,
      },
    ]);
    console.log("✓ Created transactions");

    // Create sample videos
    await db.insert(videos).values([
      {
        title: "Undifest IKEA STENSELE Table, anthracit...",
        thumbnailUrl: "https://images.unsplash.com/photo-1616587226157-48e49175ee20?w=600",
        type: "video",
        isLive: true,
      },
      {
        title: "Testimoni Udin",
        thumbnailUrl: "https://images.unsplash.com/photo-1560439514-4e9645039924?w=600",
        type: "video",
        isLive: false,
      },
      {
        title: "Rec live 29 des 25",
        thumbnailUrl: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=600",
        type: "video",
        isLive: false,
      },
      {
        title: "Rec live 28 des 25",
        thumbnailUrl: "https://images.unsplash.com/photo-1598550476439-6847785fcea6?w=600",
        type: "video",
        isLive: false,
      },
      {
        title: "Rec live 27 des 25",
        thumbnailUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600",
        type: "video",
        isLive: false,
      },
      {
        title: "Testimony Bunga",
        thumbnailUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600",
        type: "video",
        isLive: false,
      },
      {
        title: "Testimony Shinta",
        thumbnailUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600",
        type: "video",
        isLive: false,
      },
    ]);
    console.log("✓ Created videos");

    console.log("\n✅ Database seeded successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
    throw error;
  }
}

/**
 * Seed dummy manual winner history for the past 6 months.
 * Runs independently — safe to call even if main seed was skipped.
 */
export async function seedManualWinnerHistory() {
  try {
    const existing = await db.select().from(manualWinnerHistory).limit(1);
    if (existing.length > 0) {
      console.log("✓ Manual winner history already has data, skipping seed...");
      return;
    }

    console.log("🌱 Seeding manual winner history (6 bulan terakhir)...");

    // Helper: random element from array
    const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

    const eventNames = [
      "E-BOOK : Jadilah Miliarder",
      "E-BOOK : Rahasia Sukses Bisnis",
      "E-BOOK : Panduan Investasi Pemula",
      "E-BOOK : 7 Kebiasaan Jutawan",
      "Undian Spesial Lebaran",
      "Undian Akhir Tahun 2025",
    ];

    const amounts = [10000, 10000, 10000, 25000, 25000, 50000, 100000];

    const phonePrefixes = ["0812", "0813", "0851", "0852", "0853", "0856", "0857", "0858", "0877", "0878", "0881", "0882", "0888", "0895", "0896"];

    const randomPhone = () => {
      const prefix = pick(phonePrefixes);
      const mid = String(Math.floor(Math.random() * 90000) + 10000);
      const suffix = String(Math.floor(Math.random() * 900) + 100);
      return `${prefix}${mid}${suffix}`;
    };

    // Generate ~3–4 winners per week for 26 weeks (6 months back from Apr 2026)
    const entries: {
      winDate: Date;
      phoneNumber: string;
      amount: number;
      eventName: string;
      displayOrder: number;
    }[] = [];

    const now = new Date("2026-04-12");
    let order = 0;

    for (let weekOffset = 26; weekOffset >= 0; weekOffset--) {
      // 2–4 entries per week, spread across different days
      const winnersThisWeek = Math.floor(Math.random() * 3) + 2;
      for (let i = 0; i < winnersThisWeek; i++) {
        const daysBack = weekOffset * 7 + Math.floor(Math.random() * 7);
        const winDate = new Date(now);
        winDate.setDate(now.getDate() - daysBack);
        winDate.setHours(19, 0, 0, 0); // Pengundian jam 19.00

        entries.push({
          winDate,
          phoneNumber: randomPhone(),
          amount: pick(amounts),
          eventName: pick(eventNames),
          displayOrder: order++,
        });
      }
    }

    // Sort by date descending (newest first)
    entries.sort((a, b) => b.winDate.getTime() - a.winDate.getTime());

    await db.insert(manualWinnerHistory).values(entries);
    console.log(`✓ Created ${entries.length} dummy manual winner history entries`);
  } catch (error) {
    console.error("Error seeding manual winner history:", error);
    // Non-fatal — don't rethrow
  }
}
