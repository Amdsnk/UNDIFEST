import { MobileHeader } from "@/components/MobileHeader";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { Footer } from "@/components/Footer";

export default function BrandPage() {
  return (
    <div className="min-h-screen bg-[#ffffff]">
      <div className="max-w-undifest mx-auto pb-20">
        <MobileHeader />

        <div className="px-4 py-8 bg-[#16202a]">
          <h1 className="text-3xl font-bold text-white mb-6">Identitas Brand</h1>

          <div className="space-y-8 text-white">
            <section>
              <h3 className="text-xl font-bold mb-3">Tentang Undifest</h3>
              <p className="text-gray-300 text-sm leading-relaxed">
                Undifest adalah platform digital yang menyediakan produk e-book berkualitas dengan sistem yang transparan dan terpercaya. Kami hadir sebagai solusi modern untuk akses konten digital yang aman dan mudah.
              </p>
              <div className="border-b border-gray-700/50 mt-6" />
            </section>

            <section>
              <h3 className="text-xl font-bold mb-3">Nilai-Nilai Kami</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-bold text-white mb-2">Transparansi</h4>
                  <p className="text-gray-300 text-sm leading-relaxed">
                    Kami menyampaikan informasi secara terbuka dan jelas kepada setiap pembeli, mulai dari harga produk, mekanisme program, hingga ketentuan pengembalian dana.
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-white mb-2">Keamanan</h4>
                  <p className="text-gray-300 text-sm leading-relaxed">
                    Data pribadi pembeli dijaga dengan standar keamanan terbaik. Kami tidak memperjualbelikan data kepada pihak lain.
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-white mb-2">Keadilan</h4>
                  <p className="text-gray-300 text-sm leading-relaxed">
                    Program apresiasi dijalankan dengan sistem yang adil dan sesuai dengan regulasi yang berlaku di Indonesia.
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-white mb-2">Kepercayaan</h4>
                  <p className="text-gray-300 text-sm leading-relaxed">
                    Kami berkomitmen untuk menjaga kepercayaan pembeli melalui layanan yang profesional dan bertanggung jawab.
                  </p>
                </div>
              </div>
              <div className="border-b border-gray-700/50 mt-6" />
            </section>

            <section>
              <h3 className="text-xl font-bold mb-3">Identitas Visual</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-bold text-white mb-2">Logo Undifest</h4>
                  <p className="text-gray-300 text-sm leading-relaxed mb-4">
                    Logo Undifest menggambarkan semangat festival digital yang modern, dinamis, dan terpercaya. Kombinasi warna biru dan gradien mencerminkan inovasi dan profesionalitas.
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-white mb-2">Warna Brand</h4>
                  <div className="grid grid-cols-2 gap-4 mt-3">
                    <div className="bg-[#00D4FF] p-4 rounded-lg">
                      <p className="text-white font-bold">#00D4FF</p>
                      <p className="text-white text-xs">Primary Blue</p>
                    </div>
                    <div className="bg-[#0a1621] border border-gray-700 p-4 rounded-lg">
                      <p className="text-white font-bold">#0a1621</p>
                      <p className="text-white text-xs">Dark Background</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="border-b border-gray-700/50 mt-6" />
            </section>

            <section>
              <h3 className="text-xl font-bold mb-3">Tagline</h3>
              <p className="text-gray-300 text-sm leading-relaxed italic">
                "Platform Digital Terpercaya untuk E-book Berkualitas"
              </p>
              <div className="border-b border-gray-700/50 mt-6" />
            </section>

            <section>
              <h3 className="text-xl font-bold mb-3">Legalitas dan Pengawasan</h3>
              <p className="text-gray-300 text-sm leading-relaxed mb-4">
                PT. Undian Festival Indonesia telah memperoleh Penyelenggaraan dan Pengawasan dari:
              </p>
              <div className="bg-[#1a2634] p-4 rounded-lg border border-gray-700">
                <p className="text-white font-bold mb-2">Kementerian Sosial Republik Indonesia</p>
                <p className="text-gray-300 text-sm">
                  Memastikan setiap program yang kami jalankan sesuai dengan ketentuan hukum yang berlaku di Indonesia.
                </p>
              </div>
            </section>
          </div>
        </div>

        <Footer />
      </div>
      <MobileBottomNav />
    </div>
  );
}

