import { Link, useLocation } from "wouter";
import iconBarUrl from "@assets/iconbar_undifest_1763502958255.png";
import homeActiveUrl from "@assets/iconbar_Home-active_1763504048853.png";
import homeNormalUrl from "@assets/iconbar_Home-normal_1763504048854.png";
import liveActiveUrl from "@assets/iconbar_Live-active_1763505361235.png";
import liveNormalUrl from "@assets/iconbar_Live-normal_1763505361244.png";
import historyActiveUrl from "@assets/iconbar_History-active_1763505897762.png";
import historyNormalUrl from "@assets/iconbar_History-normal_1763505897763.png";
import accountActiveUrl from "@assets/iconbar_Account-active_1763506111500.png";
import accountNormalUrl from "@assets/iconbar_Account-normal_1763506111501.png";
import { HowItWorksNotif } from "./HowItWorksNotif";

export function MobileBottomNav() {
  const [location] = useLocation();

  const isActive = (path: string) => location === path;

  return (
    <>
      <HowItWorksNotif />
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 max-w-undifest w-full bg-gradient-to-b from-[#1a2332] to-[#0a1621] border-t border-[#8B2FC9]/30 z-50 mt-[-5px] mb-[-5px]">
        <div className="flex items-center justify-around mt-[0px] mb-[0px] pt-[8px] pb-[8px]" style={{ marginTop: '-7px', paddingBottom: '7.8px' }}>
        <Link href="/">
          <div
            data-testid="nav-home"
            className="flex flex-col items-center px-4 py-2 transition-all cursor-pointer"
          >
            <img 
              src={isActive("/") ? homeActiveUrl : homeNormalUrl} 
              alt="Home" 
              className="object-contain"
              style={{ width: '44px', height: '44px' }}
            />
          </div>
        </Link>

        <Link href="/live">
          <div
            data-testid="nav-live"
            className="flex flex-col items-center px-4 py-2 transition-all cursor-pointer"
          >
            <img 
              src={isActive("/live") ? liveActiveUrl : liveNormalUrl} 
              alt="Live" 
              className="object-contain"
              style={{ width: '46px', height: '46px' }}
            />
          </div>
        </Link>

        <Link href="/">
          <div
            data-testid="nav-logo"
            className="flex flex-col items-center cursor-pointer"
          >
            <img src={iconBarUrl} alt="Undifest" className="object-contain mt-[0px] mb-[0px]" style={{ width: '76px', height: '76px' }} />
          </div>
        </Link>

        <Link href="/history">
          <div
            data-testid="nav-history"
            className="flex flex-col items-center px-4 py-2 transition-all cursor-pointer"
          >
            <img 
              src={isActive("/history") ? historyActiveUrl : historyNormalUrl} 
              alt="History" 
              className="object-contain"
              style={{ width: '44px', height: '44px' }}
            />
          </div>
        </Link>

        <Link href="/account">
          <div
            data-testid="nav-account"
            className="flex flex-col items-center px-4 py-2 transition-all cursor-pointer"
          >
            <img 
              src={isActive("/account") ? accountActiveUrl : accountNormalUrl} 
              alt="Account" 
              className="object-contain"
              style={{ width: '44px', height: '44px' }}
            />
          </div>
        </Link>
        </div>
      </div>
    </>
  );
}
