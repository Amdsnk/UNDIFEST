# Panduan Deployment UNDIFEST ke Railway

## Langkah 1: Setup Database PostgreSQL di Railway

1. Buka project Anda di [Railway Dashboard](https://railway.app)
2. Klik **"+ New"** → **"Database"** → **"Add PostgreSQL"**
3. Railway akan otomatis membuat PostgreSQL database

## Langkah 2: Setup Environment Variables

1. Klik pada **service aplikasi Anda** (bukan database PostgreSQL)
2. Pergi ke tab **"Variables"**
3. Tambahkan variable berikut:

### Required Variables:
- `DATABASE_URL` - Akan otomatis tersedia jika Anda link PostgreSQL database
- `SESSION_SECRET` - Generate random string untuk keamanan session
- `NODE_ENV` - Set ke `production`

### Optional Variables:
- `PORT` - Railway akan set otomatis (default: 5000)

**Cara link database:**
- Klik **"+ New Variable"** → **"Add Reference"**
- Pilih PostgreSQL service → pilih `DATABASE_URL`

## Langkah 3: Push Database Schema

Ada 2 cara untuk push schema ke database Railway:

### Cara 1: Dari Local (Recommended)

1. Di komputer lokal, buat file `.env`:
```bash
DATABASE_URL=postgresql://postgres:password@host:port/railway
```

2. Copy `DATABASE_URL` dari Railway PostgreSQL service

3. Jalankan command:
```bash
npm run db:push
```

### Cara 2: Otomatis saat Deploy

Database schema akan otomatis di-push saat aplikasi pertama kali deploy di production mode.

## Langkah 4: Deploy Aplikasi

1. Push code ke GitHub repository Anda
2. Di Railway, connect repository:
   - Klik **"+ New"** → **"GitHub Repo"**
   - Pilih repository UNDIFEST
3. Railway akan otomatis detect dan deploy

### Build Settings (Otomatis terdeteksi):
- **Build Command**: `npm run build`
- **Start Command**: `npm start`

## Langkah 5: Verifikasi Deployment

1. Tunggu hingga deployment selesai
2. Klik **"View Logs"** untuk melihat proses deployment
3. Cari log berikut untuk memastikan sukses:
   ```
   ✅ Migrations completed successfully
   🌱 Seeding database...
   ✓ Created admin user (username: admin, password: admin123)
   ```

4. Buka URL aplikasi Anda (Railway akan generate otomatis)
5. Akses `/admin` untuk login

## Default Admin Credentials

Setelah deployment pertama kali, gunakan credentials berikut:

- **Username**: `admin`
- **Password**: `admin123`

⚠️ **PENTING**: Segera ganti password admin setelah login pertama kali!

## Troubleshooting

### Error: "SQL Error - Login failed"

**Penyebab**: Database schema belum di-push

**Solusi**:
1. Pastikan `DATABASE_URL` sudah di-set di environment variables
2. Jalankan `npm run db:push` dari local, atau
3. Redeploy aplikasi (akan otomatis run migrations)

### Error: "DATABASE_URL must be set"

**Penyebab**: Environment variable tidak tersedia

**Solusi**:
1. Pastikan PostgreSQL database sudah dibuat di Railway
2. Link database ke service aplikasi via Variables tab
3. Atau manual copy-paste `DATABASE_URL` dari PostgreSQL service

### Database Connection Timeout

**Penyebab**: SSL atau network issue

**Solusi**:
- Database config sudah include SSL dengan `rejectUnauthorized: false`
- Pastikan Railway PostgreSQL service dalam status "Active"

## Commands Berguna

```bash
# Push schema ke database (development)
npm run db:push

# Generate migration files
npm run db:generate

# Run migrations manually
npm run db:migrate

# Development mode
npm run dev

# Build untuk production
npm run build

# Start production server
npm start
```

## Struktur Database

Aplikasi akan otomatis membuat tables berikut:
- `admin_users` - Admin authentication
- `users` - Customer data
- `events` - Lottery events
- `banners` - Homepage banners
- `transactions` - Purchase records
- `winners` - Lottery winners
- `videos` - Video content

## Update Database Schema

Jika Anda mengubah schema di `shared/schema.ts`:

1. **Development**: Jalankan `npm run db:push`
2. **Production**: 
   - Generate migration: `npm run db:generate`
   - Commit migration files ke git
   - Push ke Railway (akan auto-run migrations)

## Monitoring

Gunakan Railway dashboard untuk:
- **Logs**: Monitor aplikasi dan database logs
- **Metrics**: CPU, Memory, Network usage
- **Deployments**: History dan rollback

## Backup Database

Railway PostgreSQL menyediakan automatic backups. Untuk manual backup:

1. Install Railway CLI: `npm i -g @railway/cli`
2. Login: `railway login`
3. Link project: `railway link`
4. Backup: `railway run pg_dump > backup.sql`

---

**Support**: Jika ada masalah, cek Railway logs atau dokumentasi di [docs.railway.app](https://docs.railway.app)

