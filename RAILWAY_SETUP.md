# 🚀 Quick Setup: Deploy UNDIFEST ke Railway

## Ringkasan Singkat

Ikuti 5 langkah mudah ini untuk deploy aplikasi dari Replit ke Railway dengan database baru.

---

## ✅ Langkah 1: Buat PostgreSQL Database di Railway

1. Login ke [Railway.app](https://railway.app)
2. Buka project Anda
3. Klik **"+ New"** → **"Database"** → **"Add PostgreSQL"**
4. Tunggu hingga database selesai dibuat

---

## ✅ Langkah 2: Setup Environment Variables

1. Klik pada **service aplikasi Anda** (bukan PostgreSQL)
2. Pergi ke tab **"Variables"**
3. Klik **"+ New Variable"** → **"Add Reference"**
4. Pilih PostgreSQL service → pilih **`DATABASE_URL`**
5. Klik **"Add"**

Tambahkan juga variable ini (optional):
- `SESSION_SECRET` = `your-random-secret-key-here`
- `NODE_ENV` = `production`

---

## ✅ Langkah 3: Deploy Aplikasi

Railway akan otomatis deploy setelah Anda menambahkan environment variables.

Atau manual redeploy:
1. Pergi ke tab **"Deployments"**
2. Klik **"Deploy"** atau push code baru ke GitHub

---

## ✅ Langkah 4: Tunggu Deployment Selesai

1. Klik **"View Logs"** untuk monitor proses
2. Tunggu hingga muncul log:
   ```
   ✅ Database schema created successfully
   🌱 Seeding database...
   ✓ Created admin user (username: admin, password: admin123)
   serving on port 5000
   ```

---

## ✅ Langkah 5: Login ke Admin Panel

1. Klik **"Settings"** → copy **Public Domain URL**
2. Buka URL + `/admin` (contoh: `https://your-app.railway.app/admin`)
3. Login dengan:
   - **Username**: `admin`
   - **Password**: `admin123`

---

## 🎉 Selesai!

Aplikasi Anda sudah live di Railway dengan database PostgreSQL baru!

---

## ⚠️ Troubleshooting

### Masalah: "SQL Error - Login failed"

**Solusi**:
1. Pastikan `DATABASE_URL` sudah di-set di Variables
2. Cek logs apakah ada error saat create schema
3. Redeploy aplikasi

### Masalah: "DATABASE_URL must be set"

**Solusi**:
1. Pastikan PostgreSQL database sudah dibuat
2. Link database ke service via Variables → Add Reference
3. Redeploy

### Masalah: Aplikasi tidak bisa diakses

**Solusi**:
1. Cek di Settings → pastikan ada Public Domain
2. Tunggu beberapa menit setelah deployment
3. Cek logs untuk error

---

## 📚 Dokumentasi Lengkap

Lihat [DEPLOYMENT.md](./DEPLOYMENT.md) untuk panduan lengkap dan advanced configuration.

---

## 🔧 Commands Berguna

Jika ingin setup database dari local:

```bash
# 1. Copy DATABASE_URL dari Railway
# 2. Buat file .env dan paste DATABASE_URL
# 3. Jalankan:
npm run db:push
```

---

**Need Help?** Cek Railway logs atau dokumentasi di [docs.railway.app](https://docs.railway.app)

