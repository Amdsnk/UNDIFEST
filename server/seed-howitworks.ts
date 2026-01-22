import { db } from "./db";
import { howItWorks } from "../shared/schema";

async function seedHowItWorks() {
  console.log("🌱 Seeding How It Works data...\n");

  const steps = [
    {
      step: 1,
      title: "Pilih Event Undian",
      description: "Pilih event undian yang Anda inginkan dari daftar event yang tersedia. Setiap event memiliki hadiah menarik yang bisa Anda menangkan!",
      iconUrl: null,
    },
    {
      step: 2,
      title: "Beli Tiket Undian",
      description: "Beli tiket undian dengan harga yang terjangkau. Semakin banyak tiket yang Anda beli, semakin besar peluang Anda untuk menang!",
      iconUrl: null,
    },
    {
      step: 3,
      title: "Isi Data Diri",
      description: "Lengkapi data diri Anda seperti nama, nomor telepon, kota, dan email. Data ini akan digunakan untuk menghubungi Anda jika menang.",
      iconUrl: null,
    },
    {
      step: 4,
      title: "Lakukan Pembayaran",
      description: "Pilih metode pembayaran yang tersedia (Transfer Bank, E-Wallet, dll) dan lakukan pembayaran sesuai instruksi yang diberikan.",
      iconUrl: null,
    },
    {
      step: 5,
      title: "Tunggu Pengundian",
      description: "Tunggu hingga tanggal pengundian tiba. Anda akan mendapat notifikasi jika nomor tiket Anda terpilih sebagai pemenang!",
      iconUrl: null,
    },
    {
      step: 6,
      title: "Terima Hadiah",
      description: "Jika Anda menang, hadiah akan dikirimkan ke alamat Anda atau bisa diambil langsung di kantor kami. Selamat!",
      iconUrl: null,
    },
  ];

  try {
    // Check if data already exists
    const existing = await db.select().from(howItWorks).limit(1);
    
    if (existing.length > 0) {
      console.log("⏭️  How It Works data already exists, skipping...");
      console.log(`📊 Found ${existing.length} existing steps\n`);
      return;
    }

    // Insert all steps
    for (const step of steps) {
      await db.insert(howItWorks).values(step);
      console.log(`✅ Created step ${step.step}: ${step.title}`);
    }

    console.log("\n🎉 How It Works seeding completed!");
    console.log("\n📋 Created Steps:");
    console.log("┌──────┬─────────────────────────┬────────────────────────────────────────┐");
    console.log("│ Step │ Title                   │ Description                            │");
    console.log("├──────┼─────────────────────────┼────────────────────────────────────────┤");
    steps.forEach(s => {
      const shortDesc = s.description.substring(0, 38) + "...";
      console.log(`│ ${s.step}    │ ${s.title.padEnd(23)} │ ${shortDesc.padEnd(38)} │`);
    });
    console.log("└──────┴─────────────────────────┴────────────────────────────────────────┘");
    console.log("\n💡 You can now view How It Works page!");

  } catch (error) {
    console.error("❌ Failed to seed How It Works:", error);
    process.exit(1);
  }
}

// Run the seed function
seedHowItWorks()
  .then(() => {
    console.log("\n✨ Seed script finished successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Seed script failed:", error);
    process.exit(1);
  });

