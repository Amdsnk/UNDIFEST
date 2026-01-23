import logoUrl from "@assets/logo undifest_1763476451738.png";
import logo_undifest from "@assets/logo undifest.png";
import { Link } from "wouter";

export function MobileHeader() {
  return (
    <div className="bg-gradient-to-b from-[#0a1621] to-[#1a2332] border-b border-[#8B2FC9]/30">
      <div className="max-w-undifest mx-auto px-2 md:px-4 py-3">
        <div className="flex items-center justify-between">
          <Link href="/">
            <div className="flex items-center gap-3 cursor-pointer">
              {/* Logo: 15% smaller on mobile (w-24 h-24), original size on desktop (w-28 h-28) */}
              <img src={logo_undifest} alt="Undifest" className="w-24 h-24 md:w-28 md:h-28 object-contain p-0 m-0 pt-[0px] pb-[0px] mt-[-30px] mb-[-30px]" />
            </div>
          </Link>
          <div className="text-right">
            <div className="text-sm font-semibold text-white">PT. Undian Festival Indonesia</div>
            <div className="text-xs text-gray-400">Izin Resmi : BAXSASRES</div>
          </div>
        </div>
      </div>
      <div className="h-1 bg-gradient-to-r from-[#00D4FF] via-[#8B2FC9] to-[#FF1493]" />
    </div>
  );
}
