# 💳 Panduan Verifikasi Pembayaran - UNDIFEST

## 🔄 Flow Lengkap Pembayaran

### **1. User Membuat Transaksi** 📱
```
User → Pilih Event → Pilih Metode Pembayaran (VA/QRIS) → Isi Data → Submit
```

**Output:**
- ✅ Transaksi dibuat dengan status `"pending"`
- ✅ User mendapat VA Number atau QR Code
- ✅ Berlaku 24 jam

---

### **2. User Melakukan Pembayaran** 💰

#### **Virtual Account:**
- User transfer ke VA number melalui:
  - Mobile banking (BNI/BRI/Mandiri/dll)
  - ATM
  - Internet banking

#### **QRIS:**
- User scan QR code dengan aplikasi:
  - GoPay, OVO, Dana, ShopeePay, dll
  - Mobile banking yang support QRIS

---

### **3. DOKU Mengirim Webhook** 🔔

**Setelah pembayaran berhasil**, DOKU otomatis kirim notifikasi ke:

```
POST https://undifest-production.up.railway.app/api/payments/doku/callback
```

**Payload dari DOKU:**
```json
{
  "order": {
    "invoice_number": "db5cfc29-cdbf-433e-85f0-50b6a9cf7de2",
    "amount": 10000
  },
  "transaction": {
    "status": "SUCCESS"  // atau "FAILED", "EXPIRED"
  },
  "virtual_account_info": {
    "virtual_account_number": "8829172636149983"
  }
}
```

---

### **4. Server Update Status** ✅

Server otomatis:
1. ✅ Terima webhook dari DOKU
2. ✅ Verifikasi signature (keamanan)
3. ✅ Update `paymentStatus`: `"pending"` → `"paid"`
4. ✅ Set `paidAt`: timestamp pembayaran
5. ✅ Simpan di database

**Kode di `server/routes.ts`:**
```typescript
app.post("/api/payments/doku/callback", async (req, res) => {
  const { order, transaction } = req.body;
  
  // Update status
  if (transaction.status === "SUCCESS") {
    await storage.updateTransaction(order.invoice_number, {
      paymentStatus: "paid",
      paidAt: new Date()
    });
  }
});
```

---

### **5. User Cek Status** 📱

User bisa cek dengan 2 cara:

#### **Cara 1: Halaman Riwayat**
```
Menu → Riwayat → Lihat transaksi
```
- Status berubah dari "Pending" → "Paid" ✅
- Bisa download E-book (jika ada)

#### **Cara 2: Redirect Otomatis**
```
Payment Page → Klik "Kembali ke Beranda" → Cek Riwayat
```

---

## 🧪 MODE SIMULASI (Testing)

### **Masalah:**
Karena menggunakan **SIMULATION MODE**, webhook dari DOKU **TIDAK AKAN DATANG** (tidak ada transaksi real).

### **Solusi: Tombol Simulasi Pembayaran** ✅

#### **Cara Menggunakan:**

1. **Buat transaksi** (pilih bank, dapat VA number)
2. **Lihat tombol kuning** di halaman payment:
   ```
   🧪 MODE SIMULASI
   Klik tombol di bawah untuk simulasi pembayaran berhasil
   
   [🧪 Simulasi Pembayaran Berhasil]
   ```
3. **Klik tombol** tersebut
4. **Otomatis redirect** ke Payment Success Page
5. **Download E-book** (jika tersedia)

#### **Technical Details:**

**Endpoint:**
```
POST /api/transactions/:id/simulate-payment
```

**Request:**
```json
{
  "status": "paid"  // atau "failed", "expired"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Transaction marked as paid",
  "transaction": { ... }
}
```

**Security:**
- ✅ Hanya bisa digunakan jika `DOKU_SIMULATION_MODE=true`
- ❌ Tidak bisa digunakan di production mode

---

## 🚀 Production Mode (Setelah DOKU Aktif)

### **Kapan Ganti ke Production?**

Setelah DOKU confirm:
1. ✅ IP sudah di-whitelist
2. ✅ Channel codes sudah benar
3. ✅ Semua bank channels sudah aktif

### **Cara Ganti:**

**1. Update `.env`:**
```env
DOKU_SIMULATION_MODE=false
VITE_DOKU_SIMULATION_MODE=false
```

**2. Restart server:**
```bash
npm run dev
```

**3. Deploy ke Railway:**
- Push ke Git
- Railway auto-deploy
- Update environment variables di Railway dashboard

### **Yang Berubah:**

- ❌ Tombol simulasi **HILANG** (tidak tampil lagi)
- ✅ Sistem pakai **DOKU API real**
- ✅ Webhook dari DOKU **AKTIF**
- ✅ User bayar real → Status otomatis update

---

## 📋 Checklist Testing

### **Mode Simulasi:**
- [ ] Buat transaksi VA (BNI/BRI/Mandiri)
- [ ] Dapat VA number
- [ ] Lihat tombol simulasi (kuning)
- [ ] Klik tombol simulasi
- [ ] Redirect ke success page
- [ ] Download E-book (jika ada)
- [ ] Cek riwayat transaksi (status "Paid")

### **Mode Production:**
- [ ] Buat transaksi VA
- [ ] Bayar real via mobile banking
- [ ] Tunggu webhook dari DOKU
- [ ] Status otomatis update ke "Paid"
- [ ] Download E-book tersedia
- [ ] Cek riwayat transaksi

---

## 🔧 Troubleshooting

### **Tombol Simulasi Tidak Muncul?**
✅ Check `.env`:
```env
VITE_DOKU_SIMULATION_MODE=true
```
✅ Restart dev server

### **Simulasi Gagal?**
✅ Check console log
✅ Check transaction ID valid
✅ Check `DOKU_SIMULATION_MODE=true` di server

### **Webhook Tidak Datang (Production)?**
✅ Check IP sudah di-whitelist di DOKU
✅ Check webhook URL di DOKU dashboard:
```
https://undifest-production.up.railway.app/api/payments/doku/callback
```
✅ Check server logs untuk error

---

**Status:** ✅ Ready for Testing  
**Last Updated:** 2026-03-07

