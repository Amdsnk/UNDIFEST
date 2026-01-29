import { useQuery } from "@tanstack/react-query";
import type { FooterSetting } from "@shared/schema";
import logoUrl from "@assets/logo undifest_1763476451738.png";
import kemensosLogoUrl from "@assets/logo kemensos_1763490013360.png";
import iconFbUrl from "@assets/icon_fb_1763489481907.png";
import iconIgUrl from "@assets/icon_ig_1763489481907.png";
import iconXUrl from "@assets/icon_x_1763489481912.png";
import iconYoutubeUrl from "@assets/icon_youtube_1763489481912.png";
import iconTiktokUrl from "@assets/icon_tiktok_1763489481910.png";
import iconTelegramUrl from "@assets/icon_telegram_1763489481908.png";
import iconAlamatUrl from "@assets/icon_alamat_1763489481906.png";
import iconTeleponUrl from "@assets/icon_telepon_1763489481909.png";
import iconWAUrl from "@assets/icon_WA_1763489481911.png";

export function Footer() {
  const { data: footerSettings } = useQuery<FooterSetting[]>({
    queryKey: ["/api/footer-settings"],
  });

  // Helper function to get setting value by key
  const getSetting = (key: string, defaultValue: string = "") => {
    const setting = footerSettings?.find(s => s.key === key);
    return setting?.value || defaultValue;
  };

  return (
    <footer className="px-2 md:px-4 py-8 bg-[#090a26] pt-[20px] pb-[0px]">
      {/* Two Column Layout: Company Info (Left) and Information Menu (Right) */}
      <div className="grid grid-cols-[60%_40%] gap-6">
        {/* Left Column - Logo, Company Name, Address, Phone, WhatsApp */}
        <div className="space-y-4">
          {/* Logo */}
          <img src={logoUrl} alt="Undifest" className="h-12" />

          {/* Company name: smaller on mobile (text-sm), original on desktop (text-lg) */}
          <h3 className="text-white font-bold text-sm md:text-lg">
            {getSetting("company_name", "PT. Undian Festival Indonesia")}
          </h3>

          {/* Contact Info */}
          <div className="space-y-3 pt-2">
            {/* Address: smaller text on mobile (text-xs), original on desktop (text-sm) */}
            <div className="flex items-start gap-3 text-gray-400 text-xs md:text-sm">
              <img src={iconAlamatUrl} alt="" className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <span className="text-[#ffffff] font-medium">
                {getSetting("address", "Perkantoran Prominence No. 08-99 Jalan Jalur Sutera 900, Alam Sutera RT. 003/ 009. Kab. Tangerang, Banten 15325 Indonesia")}
              </span>
            </div>
            {/* Phone: smaller text on mobile (text-xs), original on desktop (text-sm) */}
            <div className="flex items-center gap-3 text-gray-400 text-xs md:text-sm">
              <img src={iconTeleponUrl} alt="" className="w-5 h-5" />
              <span className="text-[#ffffff] font-medium">
                {getSetting("phone", "021 252515")}
              </span>
            </div>
            {/* WhatsApp: smaller text on mobile (text-xs), original on desktop (text-sm) */}
            <div className="flex items-center gap-3 text-gray-400 text-xs md:text-sm">
              <img src={iconWAUrl} alt="" className="w-5 h-5" />
              <span className="text-[#ffffff] font-medium">
                {getSetting("whatsapp", "0818-1111-818")}
              </span>
            </div>
          </div>
        </div>

        {/* Right Column - Information Menu (aligned with company name) */}
        <div className="pt-[60px]">
          {/* Information title: smaller on mobile (text-sm), original on desktop (text-lg) */}
          <h3 className="text-white font-bold text-sm md:text-lg mb-4">Information</h3>
          <div className="flex flex-col gap-3">
            {/* Links: smaller on mobile (text-xs), original on desktop (text-sm) */}
            <a href="/about" className="text-[#ffffff] text-xs md:text-sm hover:text-gray-300 transition-colors">
              Tentang Kami
            </a>
            <a href="/brand" className="text-[#ffffff] text-xs md:text-sm hover:text-gray-300 transition-colors">
              Identitas Brand
            </a>
            <a href="/faq" className="text-[#ffffff] text-xs md:text-sm hover:text-gray-300 transition-colors">
              FAQ
            </a>
            <a href="/terms" className="text-[#ffffff] text-xs md:text-sm hover:text-gray-300 transition-colors">
              Syarat dan Ketentuan
            </a>
            <a href="/privacy" className="text-[#ffffff] text-xs md:text-sm hover:text-gray-300 transition-colors">
              Kebijakan Privasi
            </a>
          </div>
        </div>
      </div>
      {/* Kementerian Sosial */}
      <div className="p-4 mt-[8px] mb-[8px]">
        <img
          src={kemensosLogoUrl}
          alt="Kementerian Sosial Republik Indonesia"
          className="h-16 pl-[0px] pr-[0px] mt-[0px] mb-[0px] ml-[-12px] mr-[-12px]"
        />
        <p className="text-[#ffffff] text-[14px] mt-[20px] mb-[20px] ml-[-12px] mr-[-12px] font-normal">
          PT. Undian Festival Indonesia telah memperoleh Izin Penyelenggaraan dan Pengawasan Undian dari Kementerian Sosial Republik Indonesia <span className="font-semibold">No. 1523/UNDIAN/2025)</span>.
        </p>
      </div>
      {/* Social Media */}
      <div className="mb-4 md:mb-8">
        <h3 className="text-white font-bold text-lg mb-4">Follow Us</h3>
        <div className="flex items-center gap-4">
          <a href={getSetting("facebook", "https://facebook.com/undifest")} className="hover-elevate" data-testid="social-facebook" target="_blank" rel="noopener noreferrer">
            <img src={iconFbUrl} alt="Facebook" className="w-10 h-10" />
          </a>
          <a href={getSetting("twitter", "https://twitter.com/undifest")} className="hover-elevate" data-testid="social-x" target="_blank" rel="noopener noreferrer">
            <img src={iconXUrl} alt="X/Twitter" className="w-10 h-10" />
          </a>
          <a href={getSetting("instagram", "https://instagram.com/undifest")} className="hover-elevate" data-testid="social-instagram" target="_blank" rel="noopener noreferrer">
            <img src={iconIgUrl} alt="Instagram" className="w-10 h-10" />
          </a>
          <a href={getSetting("youtube", "https://youtube.com/@undifest")} className="hover-elevate" data-testid="social-youtube" target="_blank" rel="noopener noreferrer">
            <img src={iconYoutubeUrl} alt="YouTube" className="w-10 h-10" />
          </a>
          <a href={getSetting("tiktok", "https://tiktok.com/@undifest")} className="hover-elevate" data-testid="social-tiktok" target="_blank" rel="noopener noreferrer">
            <img src={iconTiktokUrl} alt="TikTok" className="w-10 h-10" />
          </a>
          <a href={getSetting("telegram", "https://t.me/undifest")} className="hover-elevate" data-testid="social-telegram" target="_blank" rel="noopener noreferrer">
            <img src={iconTelegramUrl} alt="Telegram" className="w-10 h-10" />
          </a>
        </div>
      </div>
      {/* Copyright */}
      <div className="-mx-4 px-4 border-t border-gray-700/50 bg-[#1b1d36] pt-[20px] pb-[20px] mt-6">
        <p className="text-left text-[14px] text-[#ffffff]">
          {getSetting("copyright", "Copyright ©2025\nPT. Undian Festival Indonesia - Undifest. All Right Reserved").split('\n').map((line, i) => (
            <span key={i}>
              {line}
              {i === 0 && <br />}
            </span>
          ))}
        </p>
      </div>
    </footer>
  );
}
