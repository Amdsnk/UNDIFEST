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
          
          <p className="text-gray-300 text-sm leading-relaxed mb-8">
            Pembelian E-Book dengan Program Apresiasi Hadiah
          </p>

          <div className="space-y-8 text-white">
            <section>
              <h3 className="text-xl font-bold mb-3">1. Definisi Program</h3>
              <p className="text-gray-300 text-sm leading-relaxed mb-4">
                Undifest adalah platform yang dikelola oleh PT Undian Festival Indonesia yang menyediakan penjualan produk digital berupa e-book.
              </p>
              <p className="text-gray-300 text-sm leading-relaxed mb-4">
                Sebagai bagian dari program pemasaran dan apresiasi pelanggan, pembelian e-book pada periode tertentu dapat disertai dengan program hadiah sesuai ketentuan yang dijelaskan di halaman terkait.
              </p>
              <p className="text-gray-300 text-sm leading-relaxed">
                Produk utama dalam setiap transaksi adalah e-book.
              </p>
              <div className="border-b border-gray-700/50 mt-6" />
            </section>

            <section>
              <h3 className="text-xl font-bold mb-3">2. Ruang Lingkup dan Periode Program</h3>
              <ul className="text-gray-300 text-sm leading-relaxed space-y-2 list-disc list-inside">
                <li>Periode penjualan e-book ditentukan dan diinformasikan melalui halaman website dan banner program.</li>
                <li>Informasi mengenai periode program hadiah, jadwal pengumuman, serta ketentuan terkait lainnya diumumkan secara terbuka sebelum program dimulai.</li>
                <li>Setiap program berlaku terbatas pada periode yang telah ditentukan.</li>
              </ul>
              <div className="border-b border-gray-700/50 mt-6" />
            </section>

            <section>
              <h3 className="text-xl font-bold mb-3">3. Ketentuan Pembelian E-Book</h3>
              <ul className="text-gray-300 text-sm leading-relaxed space-y-2 list-disc list-inside">
                <li>E-book dijual dengan harga yang tercantum di halaman penawaran resmi Undifest.</li>
                <li>Satu pembeli diperbolehkan melakukan lebih dari satu transaksi selama periode penjualan berlangsung.</li>
                <li>Pembayaran dilakukan melalui metode pembayaran yang tersedia di platform.</li>
                <li>Setelah pembayaran berhasil diverifikasi oleh sistem, pembeli akan mendapatkan:
                  <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                    <li>Akses ke e-book yang dibeli</li>
                    <li>Informasi partisipasi dalam program hadiah (jika berlaku pada periode tersebut)</li>
                  </ul>
                </li>
                <li>Transaksi dianggap sah setelah pembayaran terkonfirmasi oleh sistem.</li>
              </ul>
              <div className="border-b border-gray-700/50 mt-6" />
            </section>

            <section>
              <h3 className="text-xl font-bold mb-3">4. Program Hadiah sebagai Apresiasi</h3>
              <ul className="text-gray-300 text-sm leading-relaxed space-y-2 list-disc list-inside">
                <li>Program hadiah merupakan bagian dari apresiasi pemasaran yang menyertai pembelian e-book pada periode tertentu.</li>
                <li>Program hadiah bukan produk utama dan tidak dijual secara terpisah.</li>
                <li>Mekanisme penentuan penerima hadiah dilakukan menggunakan sistem digital yang dirancang secara adil dan transparan.</li>
                <li>Informasi mengenai jenis hadiah, jumlah penerima, dan mekanisme program diumumkan sebelum periode program dimulai.</li>
                <li>Keputusan penerima hadiah bersifat final sesuai ketentuan yang berlaku.</li>
              </ul>
              <div className="border-b border-gray-700/50 mt-6" />
            </section>

            <section>
              <h3 className="text-xl font-bold mb-3">5. Pengembalian Dana (Refund)</h3>
              <ul className="text-gray-300 text-sm leading-relaxed space-y-2 list-disc list-inside">
                <li>Pembeli yang tidak terpilih sebagai penerima hadiah berhak mendapatkan pengembalian dana penuh (100%) sesuai ketentuan program.</li>
                <li>Pengembalian dana dilakukan paling lambat 7 (tujuh) hari kerja setelah pengumuman hasil program.</li>
                <li>Dana dikembalikan ke metode pembayaran yang sama dengan yang digunakan saat transaksi, atau sesuai informasi yang diberikan pembeli.</li>
                <li>Tidak ada potongan atau biaya tersembunyi dalam proses pengembalian dana.</li>
              </ul>
              <div className="border-b border-gray-700/50 mt-6" />
            </section>

            <section>
              <h3 className="text-xl font-bold mb-3">6. Akses dan Penggunaan E-Book</h3>
              <ul className="text-gray-300 text-sm leading-relaxed space-y-2 list-disc list-inside">
                <li>Akses terhadap e-book diberikan sesuai dengan ketentuan yang dijelaskan pada halaman produk.</li>
                <li>Ketentuan terkait akses e-book dalam kaitannya dengan program hadiah dijelaskan secara transparan sebelum pembelian dilakukan.</li>
                <li>E-book merupakan produk digital yang dilindungi hak cipta dan hanya dapat digunakan untuk kepentingan pribadi.</li>
              </ul>
              <div className="border-b border-gray-700/50 mt-6" />
            </section>

            <section>
              <h3 className="text-xl font-bold mb-3">7. Ketentuan Hadiah</h3>
              <ul className="text-gray-300 text-sm leading-relaxed space-y-2 list-disc list-inside">
                <li>Hadiah diberikan kepada penerima sesuai ketentuan program yang berlaku.</li>
                <li>Hadiah tidak dapat diuangkan atau ditukar, kecuali dinyatakan lain secara tertulis.</li>
                <li>Pajak hadiah (jika ada) ditanggung oleh penyelenggara sesuai dengan peraturan perundang-undangan yang berlaku.</li>
                <li>Pengiriman hadiah dilakukan paling lambat 7 (tujuh) hari kerja setelah pengumuman hasil program.</li>
              </ul>
              <div className="border-b border-gray-700/50 mt-6" />
            </section>

            <section>
              <h3 className="text-xl font-bold mb-3">8. Larangan dan Pembatalan Partisipasi</h3>
              <ul className="text-gray-300 text-sm leading-relaxed space-y-2 list-disc list-inside">
                <li>Pembeli dilarang melakukan kecurangan, manipulasi data, atau tindakan yang bertentangan dengan ketentuan ini.</li>
                <li>Pelanggaran terhadap ketentuan dapat mengakibatkan pembatalan partisipasi dalam program hadiah.</li>
                <li>Pembatalan akibat pelanggaran dapat mempengaruhi hak atas hadiah maupun pengembalian dana sesuai kebijakan yang berlaku.</li>
              </ul>
              <div className="border-b border-gray-700/50 mt-6" />
            </section>

            <section>
              <h3 className="text-xl font-bold mb-3">9. Perubahan Ketentuan</h3>
              <ul className="text-gray-300 text-sm leading-relaxed space-y-2 list-disc list-inside">
                <li>Penyelenggara berhak melakukan penyesuaian terhadap syarat dan ketentuan ini apabila diperlukan.</li>
                <li>Setiap perubahan tidak mengurangi hak pembeli atas pengembalian dana sesuai ketentuan program yang telah berjalan.</li>
              </ul>
              <div className="border-b border-gray-700/50 mt-6" />
            </section>

            <section>
              <h3 className="text-xl font-bold mb-3">10. Perlindungan Data Pribadi</h3>
              <ul className="text-gray-300 text-sm leading-relaxed space-y-2 list-disc list-inside">
                <li>Data pembeli dikelola dan dilindungi sesuai dengan kebijakan privasi Undifest.</li>
                <li>Data digunakan hanya untuk keperluan operasional dan tidak diperjualbelikan kepada pihak lain.</li>
              </ul>
              <div className="border-b border-gray-700/50 mt-6" />
            </section>

            <section>
              <h3 className="text-xl font-bold mb-3">11. Layanan dan Kontak</h3>
              <p className="text-gray-300 text-sm leading-relaxed">
                Untuk pertanyaan lebih lanjut terkait pembelian e-book atau program hadiah, pembeli dapat menghubungi layanan pelanggan Undifest melalui kanal resmi yang tersedia di website.
              </p>
            </section>
          </div>
        </div>

        <Footer />
      </div>
      <MobileBottomNav />
    </div>
  );
}
