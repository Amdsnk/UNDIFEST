# 🔧 Setup Database dari Local ke Railway

Jika Anda ingin push database schema dari komputer local ke Railway, ikuti langkah ini:

---

## Langkah 1: Dapatkan DATABASE_URL dari Railway

1. Login ke [Railway.app](https://railway.app)
2. Buka project Anda
3. Klik pada **PostgreSQL database** service
4. Pergi ke tab **"Variables"**
5. Copy value dari **`DATABASE_URL`**
   
   Formatnya seperti ini:
   ```
   postgresql://postgres:password@hostname.railway.app:5432/railway
   ```

---

## Langkah 2: Buat File .env

Di folder project Anda, buat file baru bernama **`.env`** (dengan titik di depan):

```bash
DATABASE_URL=postgresql://postgres:password@hostname.railway.app:5432/railway
```

**⚠️ PENTING**: 
- Ganti dengan DATABASE_URL yang Anda copy dari Railway
- File `.env` sudah ada di `.gitignore`, jadi tidak akan ter-commit ke git

---

## Langkah 3: Install Dependencies

Jika belum install dependencies, jalankan:

```bash
npm install
```

Tunggu sampai selesai (bisa 2-5 menit).

---

## Langkah 4: Push Database Schema

Setelah `npm install` selesai, jalankan:

```bash
npm run db:push
```

Anda akan melihat output seperti ini:

```
drizzle-kit: v0.31.4
drizzle-orm: v0.39.1

...applying changes

✅ Changes applied successfully
```

---

## Langkah 5: Verifikasi

Cek di Railway logs apakah database sudah siap:

1. Kembali ke Railway dashboard
2. Klik service aplikasi Anda
3. Redeploy (atau tunggu auto-deploy)
4. Cek logs, seharusnya muncul:
   ```
   ✅ Database schema already exists
   🌱 Seeding database...
   ✓ Created admin user (username: admin, password: admin123)
   ```

---

## ✅ Selesai!

Database schema sudah di-push ke Railway. Sekarang aplikasi Anda bisa login dengan:
- Username: `admin`
- Password: `admin123`

---

## 🔍 Troubleshooting

### Error: "drizzle-kit is not recognized"

**Solusi**: Pastikan `npm install` sudah selesai. Atau gunakan:
```bash
npx drizzle-kit push
```

### Error: "DATABASE_URL must be set"

**Solusi**: 
1. Pastikan file `.env` ada di root folder project
2. Pastikan isi `.env` benar (tidak ada spasi extra)
3. Restart terminal dan coba lagi

### Error: "Connection timeout"

**Solusi**:
1. Pastikan Railway PostgreSQL service dalam status "Active"
2. Cek apakah DATABASE_URL benar (copy ulang dari Railway)
3. Coba lagi setelah beberapa menit

### Error: "SSL connection error"

**Solusi**: Database config sudah include SSL, tapi jika masih error:
1. Pastikan menggunakan DATABASE_URL dari Railway (bukan local)
2. Cek firewall/antivirus tidak block koneksi

---

## 💡 Alternative: Deploy Langsung

Jika setup local terlalu ribet, Anda bisa skip langkah ini dan langsung deploy ke Railway. 

Database schema akan **otomatis dibuat** saat aplikasi pertama kali deploy di production!

Ikuti saja panduan di **[RAILWAY_SETUP.md](./RAILWAY_SETUP.md)** tanpa perlu setup local.

---

**Need Help?** Cek Railway logs atau tanya di Discord Railway community.

