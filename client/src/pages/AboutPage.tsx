import { MobileHeader } from "@/components/MobileHeader";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { Footer } from "@/components/Footer";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#0a1621]">
      <div className="pb-20">
        <MobileHeader />
        
        <div className="max-w-4xl mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-white mb-2">Tentang Kami</h1>
          <p className="text-gray-400 mb-8">
            Informasi mengenai PT. Undian Festival Indonesia
          </p>
          
          <div className="space-y-6 text-white">
            <section>
              <h3 className="text-xl font-bold mb-3 text-[#00D4FF]">Siapa Kami?</h3>
              <p className="text-gray-300 text-sm leading-relaxed mb-4">
                PT. Undian Festival Indonesia adalah perusahaan yang bergerak di bidang penjualan produk digital berupa e-book. Kami hadir untuk memberikan akses mudah terhadap konten edukatif dan informatif melalui platform digital yang aman dan terpercaya.
              </p>
              <p className="text-gray-300 text-sm leading-relaxed">
                Sebagai bagian dari strategi pemasaran, kami juga menghadirkan program apresiasi bagi pembeli e-book pada periode tertentu, yang dirancang secara transparan dan sesuai dengan ketentuan yang berlaku.
              </p>
              <div className="border-b border-gray-700/50 mt-6" />
            </section>

            <section>
              <h3 className="text-xl font-bold mb-3 text-[#00D4FF]">Visi Kami</h3>
              <p className="text-gray-300 text-sm leading-relaxed">
                Menjadi platform digital terdepan dalam penyediaan produk e-book berkualitas dengan layanan yang transparan, aman, dan memberikan nilai tambah bagi setiap pembeli.
              </p>
              <div className="border-b border-gray-700/50 mt-6" />
            </section>

            <section>
              <h3 className="text-xl font-bold mb-3 text-[#00D4FF]">Misi Kami</h3>
              <ul className="list-disc list-inside text-gray-300 text-sm leading-relaxed space-y-2">
                <li>Menyediakan produk digital berkualitas yang mudah diakses oleh masyarakat luas</li>
                <li>Menjalankan program apresiasi yang adil, transparan, dan sesuai regulasi</li>
                <li>Menjaga kepercayaan pembeli melalui layanan yang profesional dan bertanggung jawab</li>
                <li>Memberikan pengalaman berbelanja yang aman dan nyaman</li>
              </ul>
              <div className="border-b border-gray-700/50 mt-6" />
            </section>

            <section>
              <h3 className="text-xl font-bold mb-3 text-[#00D4FF]">Komitmen Kami</h3>
              <p className="text-gray-300 text-sm leading-relaxed mb-4">
                Kami berkomitmen untuk:
              </p>
              <ul className="list-disc list-inside text-gray-300 text-sm leading-relaxed space-y-2">
                <li>Menjaga transparansi dalam setiap program yang kami jalankan</li>
                <li>Melindungi data pribadi pembeli dengan standar keamanan terbaik</li>
                <li>Memberikan informasi yang jelas dan akurat sebelum pembelian</li>
                <li>Menjalankan pengembalian dana sesuai ketentuan yang berlaku</li>
                <li>Mematuhi seluruh regulasi dan peraturan yang berlaku di Indonesia</li>
              </ul>
              <div className="border-b border-gray-700/50 mt-6" />
            </section>

            <section>
              <h3 className="text-xl font-bold mb-3 text-[#00D4FF]">Legalitas</h3>
              <p className="text-gray-300 text-sm leading-relaxed mb-4">
                PT. Undian Festival Indonesia telah memperoleh Penyelenggaraan dan Pengawasan dari Kementerian Sosial Republik Indonesia, memastikan bahwa setiap program yang kami jalankan sesuai dengan ketentuan hukum yang berlaku.
              </p>
              <div className="border-b border-gray-700/50 mt-6" />
            </section>

            <section>
              <h3 className="text-xl font-bold mb-3 text-[#00D4FF]">Hubungi Kami</h3>
              <div className="text-gray-300 text-sm leading-relaxed space-y-2">
                <p><strong>Alamat:</strong><br />
                Perkantoran Prominence No. 08 99 Jalin Jalur Sutera Utara, Alam Sutera Rt. 002/004, Kec. Tangerang, Banten 15325 Indonesia</p>
                <p><strong>Telepon:</strong> 021 2826316</p>
                <p><strong>WhatsApp:</strong> 0818-111-618</p>
              </div>
            </section>
          </div>
        </div>

        <Footer />
        <MobileBottomNav />
      </div>
    </div>
  );
}

