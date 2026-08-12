type PaymentSuccessMessageParams = {
  eventName: string;
  eventPrice?: number | null;
  nomorUndian: string;
  downloadLink: string;
  hasEbook: boolean;
  undianType?: string | null;
  pilihanLine?: string;
};

export function buildPaymentSuccessMessage({
  eventName,
  eventPrice,
  nomorUndian,
  downloadLink,
  hasEbook,
  undianType,
  pilihanLine = "",
}: PaymentSuccessMessageParams): string {
  if (undianType === "A" || undianType === "B") {
    const pilihan = undianType === "A" ? "Besar" : "Kecil";
    return `✅ Pembayaran Berhasil!

Halo! Pembayaran untuk Program (Pilih) ${pilihan} telah dikonfirmasi.

🎟️ Nomor Program Anda: ${nomorUndian}

Simpan nomor program sebagai bukti keikutsertaan. Terima kasih sudah berpartisipasi di UNDIFEST! 🎉`;
  }

  if (eventPrice === 10000) {
    return `✅ Pembayaran Berhasil!

Halo! Pembayaran untuk Program Ebook 10K telah dikonfirmasi.

🎟️ Nomor Program Anda: ${nomorUndian}

📥 Download E-book: ${downloadLink}

Simpan nomor program sebagai bukti keikutsertaan. Link di atas juga bisa digunakan untuk download ulang e-book kapan saja.

Terima kasih sudah berpartisipasi di UNDIFEST! 🎉`;
  }

  if (eventPrice === 50000) {
    return `✅ Pembayaran Berhasil!

Halo! Pembayaran untuk Program Ebook 50K telah dikonfirmasi.

🎟️ Nomor Program Anda: ${nomorUndian}

📥 Download E-book: ${downloadLink}

Simpan nomor program sebagai bukti keikutsertaan. Link di atas juga bisa digunakan untuk download ulang e-book kapan saja.

Terima kasih sudah berpartisipasi di UNDIFEST! 🎉`;
  }

  return hasEbook
    ? `✅ *Pembayaran Berhasil!*\n\nHalo! Pembayaran untuk *${eventName}* telah dikonfirmasi.\n\n🎟️ *Nomor Undian Anda:* ${nomorUndian}${pilihanLine}\n\n📥 *Download E-book:*\n${downloadLink}\n\n_Simpan nomor undian sebagai bukti keikutsertaan. Link di atas juga bisa digunakan untuk download ulang e-book kapan saja._\n\nTerima kasih sudah berpartisipasi di UNDIFEST! 🎉`
    : `✅ *Pembayaran Berhasil!*\n\nHalo! Pembayaran untuk *${eventName}* telah dikonfirmasi.\n\n🎟️ *Nomor Undian Anda:* ${nomorUndian}${pilihanLine}\n\n🔗 Lihat detail transaksi:\n${downloadLink}\n\n_Simpan nomor undian sebagai bukti keikutsertaan._\n\nTerima kasih sudah berpartisipasi di UNDIFEST! 🎉`;
}