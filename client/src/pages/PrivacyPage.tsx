import { MobileHeader } from "@/components/MobileHeader";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { Footer } from "@/components/Footer";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#ffffff]">
      <div className="max-w-undifest mx-auto pb-20">
        <MobileHeader />

        <div className="px-4 py-8 bg-[#16202a]">
          <h1 className="text-3xl font-bold text-white mb-6">Kebijakan Privasi</h1>
          
          <div className="space-y-8 text-white">
            <section>
              <p className="text-gray-300 text-sm leading-relaxed">
                Kebijakan Privasi ini (beserta Syarat dan Ketentuan Penggunaan, Kebijakan Pengembalian Dana, serta informasi 
                lainnya dalam Platform Undifest) menetapkan dasar terhadap segala perolehan, pengumpulan, penyimpanan, pengolahan, 
                penganalisisan, penampilan, pengungkapan, dan/atau bentuk pengelolaan lain yang berhubungan dengan data pribadi 
                yang dapat mengidentifikasi atau digunakan untuk mengenali Pengguna yang diberikan oleh Pengguna kepada PT. Undian 
                Festival Indonesia ("Undifest", "Kami") atau yang dikumpulkan dari Pengguna melalui penggunaan Platform.
              </p>
              <p className="text-gray-300 text-sm leading-relaxed mt-4">
                Dengan menggunakan layanan dan Platform Undifest, Pengguna menyatakan telah membaca, memahami, dan menyetujui 
                seluruh ketentuan dalam Kebijakan Privasi ini, dan memberikan persetujuan kepada Undifest untuk mengelola data 
                pribadi tersebut sebagaimana diatur dalam kebijakan ini.
              </p>
              <div className="border-b border-gray-700/50 mt-6" />
            </section>

            <section>
              <h3 className="text-xl font-bold mb-3">PENGUMPULAN DATA PRIBADI</h3>
              <p className="text-gray-300 text-sm leading-relaxed mb-3">
                Pengumpulan Data Pribadi oleh Undifest dilakukan dalam rangka menunjang penggunaan layanan secara optimal, 
                memproses partisipasi dalam program undian, serta mempermudah proses verifikasi dan transaksi pengguna. Data 
                Pribadi yang dikumpulkan dapat berasal dari informasi yang diberikan secara langsung oleh Pengguna maupun yang 
                terekam secara otomatis melalui penggunaan platform.
              </p>
              <p className="text-gray-300 text-sm leading-relaxed mb-3">
                Jenis data yang kami kumpulkan antara lain:
              </p>
              <ol className="text-gray-300 text-sm leading-relaxed space-y-2 list-decimal list-inside">
                <li>Data registrasi, seperti: nama lengkap, email, nomor telepon, dan/atau tanggal lahir.</li>
                <li>Informasi identitas tambahan seperti foto identitas (KTP/SIM/Paspor) dalam hal verifikasi pemenang diperlukan.</li>
                <li>Informasi transaksi, seperti jenis tiket, jumlah pembelian, metode pembayaran, jumlah transaksi, tanggal dan waktu pembelian.</li>
                <li>Data rekening, virtual account, e-wallet, atau metode pembayaran lain yang dipilih pengguna.</li>
                <li>Data akses perangkat, seperti lokasi, alamat IP, jenis perangkat, sistem operasi, browser, serta informasi penggunaan saat melakukan pembelian, login, atau berinteraksi dengan fitur di Platform.</li>
                <li>Interaksi pengguna dengan Customer Service kami, baik melalui email, chat, telepon, atau media lainnya.</li>
                <li>Data dari perangkat yang digunakan, termasuk pilihan bahasa, nomor seri, informasi jaringan seluler, serta preferensi penggunaan.</li>
                <li>Catatan log aktivitas yang terekam pada sistem saat pengguna menggunakan Platform, termasuk fitur atau halaman yang diakses, waktu akses, serta performa sistem.</li>
                <li>Data pihak ketiga yang bekerja sama dengan Undifest, seperti mitra pembayaran, afiliasi promosi, atau vendor sistem, yang datanya diserahkan oleh pengguna atau hasil integrasi sistem.</li>
              </ol>
              <p className="text-gray-300 text-sm leading-relaxed mt-4">
                Dengan menyerahkan data di atas, Pengguna melepaskan hak klaim, tuntutan, maupun gugatan atas segala bentuk 
                penggunaan, penyimpanan, atau pengungkapan data pribadi sesuai dengan Kebijakan Privasi ini.
              </p>
              <div className="border-b border-gray-700/50 mt-6" />
            </section>

            <section>
              <h3 className="text-xl font-bold mb-3">PENGGUNAAN DATA PRIBADI</h3>
              <p className="text-gray-300 text-sm leading-relaxed mb-3">
                Undifest menggunakan Data Pribadi Pengguna dengan tujuan sebagai berikut:
              </p>
              <ol className="text-gray-300 text-sm leading-relaxed space-y-2 list-decimal list-inside">
                <li>Memproses transaksi pembelian tiket undian dan verifikasi kepemilikan tiket.</li>
                <li>Mengelola partisipasi dalam program undian, pengundian pemenang, dan pengumuman hasil undian.</li>
                <li>Melakukan verifikasi identitas apabila diperlukan, terutama saat pengguna terpilih sebagai pemenang atau mengajukan pengembalian dana.</li>
                <li>Menyediakan layanan pelanggan, termasuk memeriksa dan menanggapi keluhan atau pertanyaan dari pengguna melalui email, telepon, WhatsApp, atau media komunikasi lainnya.</li>
                <li>Memberikan informasi penting seputar produk, layanan, pembaruan sistem, dan pengumuman resmi dari Undifest.</li>
                <li>Menganalisis perilaku dan preferensi pengguna untuk peningkatan layanan.</li>
                <li>Melakukan investigasi terhadap aktivitas mencurigakan atau pelanggaran terhadap hukum dan kebijakan platform.</li>
                <li>Menyediakan data kepada otoritas resmi apabila diminta secara sah berdasarkan ketentuan hukum di Republik Indonesia.</li>
              </ol>
              <div className="border-b border-gray-700/50 mt-6" />
            </section>

            <section>
              <h3 className="text-xl font-bold mb-3">PERLINDUNGAN DATA PRIBADI</h3>
              <p className="text-gray-300 text-sm leading-relaxed mb-3">
                Undifest berkomitmen menjaga kerahasiaan dan keamanan Data Pribadi Pengguna yang berada di bawah kendali kami. 
                Kami tidak akan menjual, menyewakan, atau mendistribusikan Data Pribadi kepada pihak ketiga tanpa persetujuan, 
                kecuali dalam kondisi berikut:
              </p>
              <ol className="text-gray-300 text-sm leading-relaxed space-y-2 list-decimal list-inside">
                <li>Diperlukan oleh pihak internal atau vendor resmi Undifest untuk menunjang kelancaran transaksi atau pengelolaan sistem.</li>
                <li>Dibutuhkan dalam kerja sama dengan mitra layanan (seperti penyedia sistem pembayaran, logistik hadiah, notaris, atau pengacara).</li>
                <li>Diperlukan untuk keperluan verifikasi identitas, termasuk pengecekan kelayakan dan kepatuhan terhadap peraturan.</li>
                <li>Diminta oleh lembaga atau aparat penegak hukum yang berwenang sebagai bagian dari kewajiban hukum.</li>
              </ol>
              <p className="text-gray-300 text-sm leading-relaxed mt-4">
                Kami menerapkan sistem keamanan yang memadai termasuk enkripsi, otentikasi dua langkah (OTP), dan pembatasan 
                akses internal untuk melindungi Data Pribadi dari akses yang tidak sah. Namun, Pengguna wajib menjaga keamanan 
                akun miliknya secara mandiri.
              </p>
              <div className="border-b border-gray-700/50 mt-6" />
            </section>

            <section>
              <h3 className="text-xl font-bold mb-3">KEBIJAKAN TERKAIT ANAK-ANAK</h3>
              <p className="text-gray-300 text-sm leading-relaxed">
                Layanan Undifest tidak diperuntukkan bagi anak di bawah usia 15 tahun. Kami tidak mengumpulkan data anak-anak 
                secara sengaja. Jika orang tua atau wali menemukan bahwa anak di bawah pengawasannya telah mengirimkan data 
                pribadi kepada Undifest, maka mereka dapat meminta penghapusan data tersebut melalui layanan "Hubungi Kami".
              </p>
              <div className="border-b border-gray-700/50 mt-6" />
            </section>

            <section>
              <h3 className="text-xl font-bold mb-3">COOKIE</h3>
              <p className="text-gray-300 text-sm leading-relaxed">
                Kami menggunakan cookie dan teknologi serupa untuk menyimpan preferensi pengguna, mempercepat login, serta 
                melakukan analisis statistik penggunaan platform. Cookie tidak digunakan di luar lingkup Platform Undifest. 
                Pengguna dapat mengatur browser untuk menolak atau menghapus cookie, meskipun hal ini mungkin berdampak pada 
                fungsionalitas layanan.
              </p>
              <div className="border-b border-gray-700/50 mt-6" />
            </section>

            <section>
              <h3 className="text-xl font-bold mb-3">KEAMANAN AKUN DAN TANGGUNG JAWAB PENGGUNA</h3>
              <p className="text-gray-300 text-sm leading-relaxed">
                Undifest melakukan berbagai upaya untuk menjaga keamanan data pengguna, namun pengguna juga bertanggung jawab 
                sepenuhnya atas keamanan akun pribadi mereka, termasuk email dan password. Setiap penyalahgunaan akun akibat 
                kelalaian pengguna menjadi tanggung jawab pengguna sepenuhnya.
              </p>
              <div className="border-b border-gray-700/50 mt-6" />
            </section>

            <section>
              <h3 className="text-xl font-bold mb-3">PEMBATALAN PERSETUJUAN</h3>
              <ol className="text-gray-300 text-sm leading-relaxed space-y-2 list-decimal list-inside">
                <li>Undifest berhak menolak permintaan akses atau koreksi atas data yang kami simpan jika permintaan tidak sesuai atau bertentangan dengan hukum yang berlaku.</li>
                <li>Pengguna dapat mengajukan permintaan penghapusan data pribadi atau penutupan akun melalui formulir "Hubungi Kami" di situs resmi Undifest.</li>
                <li>Kami akan memproses permintaan setelah verifikasi data pengguna yang sah.</li>
                <li>Jika pengguna merasa privasinya dilanggar, mereka dapat mengajukan keluhan melalui Customer Service, dan kami akan menyelidiki laporan tersebut dengan sebaik-baiknya.</li>
              </ol>
              <div className="border-b border-gray-700/50 mt-6" />
            </section>

            <section>
              <h3 className="text-xl font-bold mb-3">KONTAK KAMI</h3>
              <p className="text-gray-300 text-sm leading-relaxed mb-3">
                Untuk pertanyaan, masukan, atau permintaan seputar data pribadi, silakan hubungi kami:
              </p>
              <ul className="text-gray-300 text-sm leading-relaxed space-y-2">
                <li>📧 Email: menang@undifest.com</li>
                <li>📱 WhatsApp: 628811111898</li>
                <li>🏢 PT. Undian Festival Indonesia</li>
              </ul>
              <div className="border-b border-gray-700/50 mt-6" />
            </section>

            <section>
              <h3 className="text-xl font-bold mb-3">PERUBAHAN KEBIJAKAN PRIVASI</h3>
              <p className="text-gray-300 text-sm leading-relaxed">
                Undifest dapat melakukan perubahan atas Kebijakan Privasi ini dari waktu ke waktu sebagai bagian dari pengembangan 
                layanan, kebutuhan hukum, atau kebijakan internal. Setiap perubahan akan diinformasikan melalui Platform. Penggunaan 
                layanan setelah perubahan dianggap sebagai persetujuan atas versi terbaru Kebijakan Privasi.
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
