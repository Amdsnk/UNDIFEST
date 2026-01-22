import { MobileHeader } from "@/components/MobileHeader";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { Footer } from "@/components/Footer";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#ffffff]">
      <div className="max-w-undifest mx-auto pb-20">
        <MobileHeader />

        <div className="px-4 py-8 bg-[#16202a]">
          <h1 className="text-3xl font-bold text-white mb-6">Syarat dan Ketentuan</h1>
          
          <div className="space-y-8 text-white">
            <section>
              <h2 className="text-2xl font-bold mb-4 text-[#00D4FF]">
                Syarat dan Ketentuan Program Undian Berhadiah dengan Jaminan Uang Kembali
              </h2>
            </section>

            <section>
              <h3 className="text-xl font-bold mb-3">1. Definisi Program</h3>
              <p className="text-gray-300 text-sm leading-relaxed">
                Program ini adalah kegiatan pengundian berhadiah yang diselenggarakan oleh PT. Undian Festival Indonesia, 
                di mana setiap peserta yang membeli e-book mendapat tiket berhak mengikuti undian, dan apabila tidak terpilih 
                sebagai pemenang, dana pembelian tiket akan dikembalikan 100%.
              </p>
              <div className="border-b border-gray-700/50 mt-6" />
            </section>

            <section>
              <h3 className="text-xl font-bold mb-3">2. Periode Program</h3>
              <ul className="text-gray-300 text-sm leading-relaxed space-y-2 list-disc list-inside">
                <li>Masa pembelian tiket: Terlampir di Banner Undian</li>
                <li>Tanggal pengundian: Terlampir di Banner Undian</li>
                <li>Proses refund: maksimal 7 hari kerja setelah pengumuman pemenang</li>
              </ul>
              <div className="border-b border-gray-700/50 mt-6" />
            </section>

            <section>
              <h3 className="text-xl font-bold mb-3">3. Ketentuan Pembelian Tiket</h3>
              <ul className="text-gray-300 text-sm leading-relaxed space-y-2 list-disc list-inside">
                <li>Harga tiket: Terlampir di Banner Undian.</li>
                <li>Satu peserta dapat membeli lebih dari satu tiket.</li>
                <li>Pembayaran dilakukan melalui [metode: transfer, VA, QRIS, dll].</li>
                <li>Bukti pembelian berupa kode unik akan dikirimkan secara otomatis setelah pembayaran terverifikasi.</li>
                <li>Tiket hanya sah jika pembayaran berhasil dan dikonfirmasi oleh sistem.</li>
              </ul>
              <div className="border-b border-gray-700/50 mt-6" />
            </section>

            <section>
              <h3 className="text-xl font-bold mb-3">4. Ketentuan Pengundian</h3>
              <ul className="text-gray-300 text-sm leading-relaxed space-y-2 list-disc list-inside">
                <li>Pengundian dilakukan secara acak dan adil menggunakan sistem digital.</li>
                <li>Pemenang akan diumumkan melalui [Website/Media Sosial] pada tanggal terlampir di banner undian.</li>
                <li>Jumlah pemenang dan hadiah yang tersedia akan diumumkan sebelum periode pembelian dimulai.</li>
              </ul>
              <div className="border-b border-gray-700/50 mt-6" />
            </section>

            <section>
              <h3 className="text-xl font-bold mb-3">5. Pengembalian Dana (Refund)</h3>
              <ul className="text-gray-300 text-sm leading-relaxed space-y-2 list-disc list-inside">
                <li>Seluruh peserta yang tidak terpilih sebagai pemenang akan menerima pengembalian dana penuh (100%).</li>
                <li>Dana akan dikembalikan ke rekening / metode pembayaran yang sama saat pembelian, atau sesuai instruksi yang diberikan saat pendaftaran.</li>
                <li>Proses pengembalian dilakukan paling lambat 7 hari kerja setelah pengumuman pemenang.</li>
                <li>Peserta wajib menjaga kode tiket sebagai bukti keikutsertaan.</li>
              </ul>
              <div className="border-b border-gray-700/50 mt-6" />
            </section>

            <section>
              <h3 className="text-xl font-bold mb-3">6. Ketentuan Hadiah</h3>
              <ul className="text-gray-300 text-sm leading-relaxed space-y-2 list-disc list-inside">
                <li>Hadiah tidak dapat diuangkan atau ditukar kecuali dinyatakan lain oleh penyelenggara.</li>
                <li>Pajak hadiah (jika ada) akan ditanggung oleh penyelenggara sesuai ketentuan berlaku.</li>
                <li>Hadiah dikirim kepada pemenang paling lambat 7 hari kerja setelah pengumuman.</li>
              </ul>
              <div className="border-b border-gray-700/50 mt-6" />
            </section>

            <section>
              <h3 className="text-xl font-bold mb-3">7. Larangan dan Diskualifikasi</h3>
              <ul className="text-gray-300 text-sm leading-relaxed space-y-2 list-disc list-inside">
                <li>Peserta yang melakukan kecurangan, manipulasi data, atau pelanggaran terhadap ketentuan akan didiskualifikasi dan tidak berhak atas hadiah maupun refund.</li>
                <li>Penyelenggara berhak menolak peserta yang tidak memenuhi ketentuan tanpa pemberitahuan sebelumnya.</li>
              </ul>
              <div className="border-b border-gray-700/50 mt-6" />
            </section>

            <section>
              <h3 className="text-xl font-bold mb-3">8. Perubahan Ketentuan</h3>
              <p className="text-gray-300 text-sm leading-relaxed">
                Penyelenggara berhak melakukan perubahan terhadap syarat & ketentuan sewaktu-waktu dengan atau tanpa 
                pemberitahuan terlebih dahulu, tanpa mengurangi hak peserta untuk menerima refund sesuai janji awal.
              </p>
              <div className="border-b border-gray-700/50 mt-6" />
            </section>

            <section>
              <h3 className="text-xl font-bold mb-3">9. Kontak Penyelenggara</h3>
              <p className="text-gray-300 text-sm leading-relaxed mb-3">
                Untuk pertanyaan lebih lanjut, silakan hubungi kami melalui:
              </p>
              <ul className="text-gray-300 text-sm leading-relaxed space-y-2 list-disc list-inside">
                <li>Email: menang@undifest.com</li>
                <li>WhatsApp: 628811111898</li>
                <li>Website: https://undifest.com</li>
              </ul>
            </section>
          </div>
        </div>

        <Footer />
      </div>
      <MobileBottomNav />
    </div>
  );
}
