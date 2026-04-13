import { MobileHeader } from "@/components/MobileHeader";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { Footer } from "@/components/Footer";

export default function DeliveryPolicyPage() {
  return (
    <div className="min-h-screen bg-[#ffffff]">
      <div className="max-w-undifest mx-auto pb-20">
        <MobileHeader />

        <div className="px-4 py-8 bg-[#16202a]">
          <h1 className="text-3xl font-bold text-white mb-6">Delivery Policy</h1>

          <div className="space-y-6 text-white">
            <section>
              <p className="text-gray-300 text-sm leading-relaxed">
                Produk yang tersedia pada Undifest merupakan produk digital berupa e-book yang akan dikirimkan secara
                otomatis setelah pembayaran berhasil diverifikasi oleh sistem.
              </p>
            </section>

            <section>
              <p className="text-gray-300 text-sm leading-relaxed mb-3">
                Setelah transaksi dinyatakan sukses, pembeli akan menerima akses produk melalui:
              </p>
              <ul className="text-gray-300 text-sm leading-relaxed space-y-2 list-disc list-inside">
                <li>Halaman konfirmasi setelah pembayaran (on-screen delivery), dan/atau</li>
                <li>Pengiriman ke alamat email yang telah didaftarkan saat melakukan pembelian</li>
              </ul>
            </section>

            <section>
              <p className="text-gray-300 text-sm leading-relaxed">
                Oleh karena itu, pembeli diwajibkan untuk memastikan bahwa data yang diinput, khususnya alamat email
                dan nomor kontak, telah benar dan aktif sebelum menyelesaikan transaksi.
              </p>
            </section>

            <div className="border-b border-gray-700/50" />

            <section>
              <p className="text-gray-300 text-sm leading-relaxed">
                Pengiriman produk digital dilakukan secara otomatis oleh sistem dalam waktu singkat setelah pembayaran
                berhasil. Namun, dalam kondisi tertentu seperti gangguan jaringan, keterlambatan dari penyedia layanan
                pembayaran, atau kesalahan input data oleh pengguna, proses pengiriman dapat mengalami keterlambatan.
              </p>
            </section>

            <section>
              <p className="text-gray-300 text-sm leading-relaxed">
                Apabila pembeli tidak menerima produk dalam waktu yang wajar, pembeli dapat menghubungi layanan
                pelanggan kami dengan menyertakan bukti transaksi dan data pendukung yang relevan untuk proses
                pengecekan lebih lanjut.
              </p>
            </section>

            <div className="border-b border-gray-700/50" />

            <section>
              <p className="text-gray-300 text-sm leading-relaxed">
                Undifest berkomitmen untuk memastikan setiap transaksi yang valid akan mendapatkan akses produk sesuai
                dengan ketentuan yang berlaku.
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
