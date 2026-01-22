# 📋 Summary: Perubahan untuk Migrasi Database ke Railway

## ✅ Perubahan yang Sudah Dibuat

### 1. **File Baru**
- ✅ `server/db-migrate.ts` - Script untuk auto-create database schema
- ✅ `DEPLOYMENT.md` - Panduan lengkap deployment ke Railway
- ✅ `RAILWAY_SETUP.md` - Quick start guide (5 langkah mudah)
- ✅ `MIGRATION_SUMMARY.md` - File ini

### 2. **File yang Diupdate**

#### `package.json`
Ditambahkan scripts baru:
```json
"db:generate": "drizzle-kit generate",
"db:migrate": "tsx server/db-migrate.ts"
```

#### `server/index.ts`
Ditambahkan auto-migration saat startup di production:
```typescript
// Run migrations first in production
if (app.get("env") === "production") {
  await runMigrations();
}
```

### 3. **File yang Sudah Ada (Tidak Perlu Diubah)**
- ✅ `railway.json` - Sudah configured dengan benar
- ✅ `drizzle.config.ts` - Sudah configured untuk PostgreSQL
- ✅ `server/db.ts` - Sudah support SSL connection
- ✅ `server/db-seed.ts` - Sudah ada untuk create admin user

---

## 🚀 Cara Deploy ke Railway

### **Opsi 1: Quick Setup (Recommended)**

Ikuti panduan di **[RAILWAY_SETUP.md](./RAILWAY_SETUP.md)** - hanya 5 langkah!

### **Opsi 2: Detailed Guide**

Ikuti panduan lengkap di **[DEPLOYMENT.md](./DEPLOYMENT.md)**

---

## 📝 Checklist Deployment

- [ ] **Step 1**: Buat PostgreSQL database di Railway
- [ ] **Step 2**: Link `DATABASE_URL` ke service aplikasi
- [ ] **Step 3**: Deploy aplikasi (otomatis atau manual)
- [ ] **Step 4**: Tunggu logs menunjukkan "Database schema created successfully"
- [ ] **Step 5**: Login ke `/admin` dengan `admin` / `admin123`

---

## 🔍 Cara Kerja Auto-Migration

1. **Saat aplikasi start di production**:
   - Check apakah table `admin_users` sudah ada
   - Jika belum, create semua tables otomatis
   - Jalankan seed untuk create admin user default

2. **Tables yang dibuat**:
   - `admin_users` - Admin authentication
   - `users` - Customer data
   - `events` - Lottery events
   - `banners` - Homepage banners
   - `transactions` - Purchase records
   - `winners` - Lottery winners
   - `videos` - Video content

3. **Default admin user**:
   - Username: `admin`
   - Password: `admin123`

---

## ⚙️ Environment Variables yang Dibutuhkan

Di Railway service aplikasi, pastikan ada:

1. **`DATABASE_URL`** (Required)
   - Dari PostgreSQL service
   - Format: `postgresql://user:password@host:port/database`

2. **`SESSION_SECRET`** (Optional, tapi recommended)
   - Random string untuk keamanan
   - Default: `undifest-secret-key-change-in-production`

3. **`NODE_ENV`** (Optional)
   - Set ke `production` untuk enable auto-migration
   - Railway biasanya auto-set ini

---

## 🧪 Testing Setelah Deploy

1. **Cek Logs**:
   ```
   ✅ Database schema created successfully
   🌱 Seeding database...
   ✓ Created admin user (username: admin, password: admin123)
   serving on port 5000
   ```

2. **Test Login Admin**:
   - Buka `https://your-app.railway.app/admin`
   - Login dengan `admin` / `admin123`
   - Jika berhasil, database sudah siap!

3. **Test User Flow**:
   - Buka homepage
   - Coba beli event (akan minta OTP)
   - Cek apakah data tersimpan di admin panel

---

## 🔧 Troubleshooting

### Error: "SQL Error - Login failed"

**Penyebab**: Database schema belum dibuat

**Solusi**:
1. Cek logs apakah ada error saat create schema
2. Pastikan `DATABASE_URL` benar
3. Redeploy aplikasi

### Error: "DATABASE_URL must be set"

**Penyebab**: Environment variable tidak ada

**Solusi**:
1. Pastikan PostgreSQL database sudah dibuat di Railway
2. Link database via Variables → Add Reference
3. Atau manual copy-paste `DATABASE_URL`

### Tables tidak terbuat

**Solusi Manual**:
```bash
# Di local, dengan DATABASE_URL dari Railway
npm run db:push
```

---

## 📞 Next Steps

1. ✅ Commit semua perubahan ke git
2. ✅ Push ke GitHub (jika belum)
3. ✅ Follow [RAILWAY_SETUP.md](./RAILWAY_SETUP.md)
4. ✅ Deploy dan test
5. ✅ Ganti password admin setelah login pertama

---

## 💡 Tips

- **Backup**: Railway PostgreSQL auto-backup, tapi bisa manual backup juga
- **Monitoring**: Gunakan Railway dashboard untuk monitor logs dan metrics
- **Security**: Segera ganti password admin default setelah deploy
- **Updates**: Untuk update schema, gunakan `npm run db:push` dari local

---

**Happy Deploying! 🎉**

