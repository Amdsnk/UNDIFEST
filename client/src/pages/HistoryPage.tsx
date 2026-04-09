import { useQuery } from "@tanstack/react-query";
import { MobileHeader } from "@/components/MobileHeader";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { Footer } from "@/components/Footer";
import type { ManualWinnerHistory } from "@shared/schema";
import historyPicUrl from "@assets/history pic_1763511883477.png";

export default function HistoryPage() {
  // Fetch manual winner history (admin-managed, shown publicly)
  const { data: history, isLoading } = useQuery<ManualWinnerHistory[]>({
    queryKey: ["/api/manual-winner-history"],
  });

  const maskPhoneNumber = (phone: string) => {
    if (!phone || phone.length <= 6) return phone;
    return phone.slice(0, 4) + "*".repeat(phone.length - 7) + phone.slice(-3);
  };

  return (
    <div className="min-h-screen bg-[#ffffff]">
      <div className="max-w-undifest mx-auto pb-20">
        <MobileHeader />

        <div className="px-4 py-6 bg-[#16202a]">
          {/* Banner Section */}
          <div className="flex items-center justify-between rounded-xl p-4 pt-[0px] pb-[0px] bg-[#2e3e59a8] mb-[15px] mt-[15px]">
            <div>
              <h1 className="text-2xl font-bold text-white">Riwayat Pemenang</h1>
              <p className="text-gray-400 text-sm">Daftar lengkap pemenang Undifest</p>
            </div>
            <div className="relative">
              <img
                src={historyPicUrl}
                alt="Winner Badge"
                className="w-24 h-24 object-contain mt-[-15px] mb-[-15px]"
                data-testid="winner-badge-image"
              />
            </div>
          </div>

          {/* Table */}
          <div className="bg-[#0f1a26] rounded-xl overflow-hidden border-2 border-gray-800 mt-[30px] mb-[150px] pt-[0px] pb-[0px]">
            {/* Header */}
            <div className="bg-[#FFB800] p-3">
              <div className="grid grid-cols-4 gap-1 md:gap-2 text-black font-bold text-[10px] md:text-sm">
                <div>Tanggal</div>
                <div>Pemenang</div>
                <div>Nominal (Rp)</div>
                <div>Event</div>
              </div>
            </div>

            {/* Rows */}
            <div className="divide-y divide-gray-800">
              {isLoading ? (
                <div className="p-6 text-center text-gray-400">Loading...</div>
              ) : history && history.length > 0 ? (
                history.map((entry) => (
                  <div
                    key={entry.id}
                    data-testid={`winner-${entry.id}`}
                    className="grid grid-cols-4 gap-1 md:gap-2 p-2 md:p-3 text-white text-[10px] md:text-sm bg-[#1a2332]/50 hover:bg-[#1a2332] transition-colors"
                  >
                    <div className="font-medium">
                      {new Date(entry.winDate).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "2-digit"
                      })}
                    </div>
                    <div className="font-mono text-[9px] md:text-xs break-all">
                      {maskPhoneNumber(entry.phoneNumber)}
                    </div>
                    <div className="font-bold">
                      {entry.amount.toLocaleString('id-ID')}
                    </div>
                    <div className="truncate text-[9px] md:text-sm">
                      {entry.eventName}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-12 text-center text-gray-400 text-sm">
                  Belum ada pemenang
                </div>
              )}
            </div>
          </div>
        </div>

        <Footer />
        <MobileBottomNav />
      </div>
    </div>
  );
}
