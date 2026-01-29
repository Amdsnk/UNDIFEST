import { MobileHeader } from "@/components/MobileHeader";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { Footer } from "@/components/Footer";

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-[#0a1621]">
      <div className="pb-20">
        <MobileHeader />
        
        <div className="max-w-4xl mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-white mb-2">FAQ – Undifest</h1>
          <p className="text-gray-400 mb-8">
            Informasi umum mengenai pembelian e-book dan program apresiasi yang berlaku di Undifest.
          </p>
          
          <div className="space-y-6 text-white">
            <section>
              <h3 className="text-xl font-bold mb-3 text-[#00D4FF]">Apa itu Undifest?</h3>
              <p className="text-gray-300 text-sm leading-relaxed">
                Undifest adalah platform resmi yang menyediakan penjualan produk digital berupa e-book. Sebagai bagian dari strategi pemasaran, Undifest juga menghadirkan program apresiasi bagi pembeli e-book pada periode tertentu.
              </p>
              <div className="border-b border-gray-700/50 mt-6" />
            </section>

            <section>
              <h3 className="text-xl font-bold mb-3 text-[#00D4FF]">Apa produk utama yang dijual di Undifest?</h3>
              <p className="text-gray-300 text-sm leading-relaxed">
                Produk utama yang dijual di Undifest adalah e-book. Setiap transaksi merupakan pembelian produk digital sesuai informasi yang tercantum di halaman penawaran.
              </p>
              <div className="border-b border-gray-700/50 mt-6" />
            </section>

            <section>
              <h3 className="text-xl font-bold mb-3 text-[#00D4FF]">Apa yang saya dapatkan setelah membeli e-book?</h3>
              <p className="text-gray-300 text-sm leading-relaxed">
                Setelah pembelian berhasil, pembeli akan mendapatkan akses ke e-book yang dibeli. Pada periode tertentu, pembelian e-book juga dapat disertai dengan kesempatan mengikuti program apresiasi hadiah.
              </p>
              <div className="border-b border-gray-700/50 mt-6" />
            </section>

            <section>
              <h3 className="text-xl font-bold mb-3 text-[#00D4FF]">Apakah pembelian e-book tetap sah tanpa mengikuti program hadiah?</h3>
              <p className="text-gray-300 text-sm leading-relaxed">
                Ya. Pembelian e-book tetap sah sebagai transaksi utama. Program hadiah merupakan bagian tambahan dan tidak mempengaruhi akses maupun penggunaan e-book.
              </p>
              <div className="border-b border-gray-700/50 mt-6" />
            </section>

            <section>
              <h3 className="text-xl font-bold mb-3 text-[#00D4FF]">Bagaimana mekanisme program apresiasi hadiah?</h3>
              <p className="text-gray-300 text-sm leading-relaxed">
                Program apresiasi dijalankan menggunakan sistem digital yang dirancang secara adil dan transparan. Informasi mengenai periode, mekanisme, dan bentuk apresiasi diumumkan secara terbuka sebelum program dimulai.
              </p>
              <div className="border-b border-gray-700/50 mt-6" />
            </section>

            <section>
              <h3 className="text-xl font-bold mb-3 text-[#00D4FF]">Kapan informasi penerima hadiah diumumkan?</h3>
              <p className="text-gray-300 text-sm leading-relaxed">
                Informasi terkait waktu pengumuman disampaikan melalui banner program dan kanal resmi Undifest yang tersedia di website.
              </p>
              <div className="border-b border-gray-700/50 mt-6" />
            </section>

            <section>
              <h3 className="text-xl font-bold mb-3 text-[#00D4FF]">Jika saya tidak mendapatkan hadiah, apakah dana saya dikembalikan?</h3>
              <p className="text-gray-300 text-sm leading-relaxed">
                Ya. Pembeli yang tidak terpilih sebagai penerima hadiah akan mendapatkan pengembalian dana penuh (100%) sesuai dengan ketentuan program yang berlaku.
              </p>
              <div className="border-b border-gray-700/50 mt-6" />
            </section>

            <section>
              <h3 className="text-xl font-bold mb-3 text-[#00D4FF]">Kapan proses pengembalian dana dilakukan?</h3>
              <p className="text-gray-300 text-sm leading-relaxed">
                Proses pengembalian dana dilakukan paling lambat 7 (tujuh) hari kerja setelah pengumuman hasil program.
              </p>
              <div className="border-b border-gray-700/50 mt-6" />
            </section>

            <section>
              <h3 className="text-xl font-bold mb-3 text-[#00D4FF]">Ke mana dana pengembalian dikirim?</h3>
              <p className="text-gray-300 text-sm leading-relaxed">
                Dana dikembalikan ke metode pembayaran yang sama dengan yang digunakan saat transaksi, atau sesuai informasi yang diberikan pembeli.
              </p>
              <div className="border-b border-gray-700/50 mt-6" />
            </section>

            <section>
              <h3 className="text-xl font-bold mb-3 text-[#00D4FF]">Apakah ada biaya atau potongan dalam proses pengembalian dana?</h3>
              <p className="text-gray-300 text-sm leading-relaxed">
                Tidak. Pengembalian dana dilakukan secara penuh tanpa potongan apa pun.
              </p>
              <div className="border-b border-gray-700/50 mt-6" />
            </section>

            <section>
              <h3 className="text-xl font-bold mb-3 text-[#00D4FF]">Bagaimana Undifest menjaga transparansi kepada pembeli?</h3>
              <p className="text-gray-300 text-sm leading-relaxed">
                Undifest menyampaikan informasi penting seperti harga e-book, periode program apresiasi, jadwal pengumuman, dan pengembalian dana secara terbuka sebelum pembelian dilakukan.
              </p>
              <div className="border-b border-gray-700/50 mt-6" />
            </section>

            <section>
              <h3 className="text-xl font-bold mb-3 text-[#00D4FF]">Apakah data pribadi saya aman?</h3>
              <p className="text-gray-300 text-sm leading-relaxed">
                Undifest berkomitmen menjaga keamanan dan kerahasiaan data pembeli. Data digunakan hanya untuk keperluan operasional dan tidak diperjualbelikan kepada pihak lain.
              </p>
              <div className="border-b border-gray-700/50 mt-6" />
            </section>

            <section>
              <h3 className="text-xl font-bold mb-3 text-[#00D4FF]">Apakah Undifest menjanjikan hadiah tertentu?</h3>
              <p className="text-gray-300 text-sm leading-relaxed">
                Tidak. Program apresiasi bersifat terbatas dan mengikuti ketentuan yang berlaku. Undifest tidak memberikan janji atau kepastian atas hasil program tersebut.
              </p>
              <div className="border-b border-gray-700/50 mt-6" />
            </section>

            <section>
              <h3 className="text-xl font-bold mb-3 text-[#00D4FF]">Di mana saya bisa membaca ketentuan lengkap?</h3>
              <p className="text-gray-300 text-sm leading-relaxed">
                Ketentuan lengkap mengenai pembelian e-book dan program apresiasi dapat dibaca pada halaman <a href="/terms" className="text-[#00D4FF] hover:underline">Syarat dan Ketentuan</a> di website resmi Undifest.
              </p>
            </section>
          </div>
        </div>

        <Footer />
        <MobileBottomNav />
      </div>
    </div>
  );
}

