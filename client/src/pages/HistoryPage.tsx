import { useQuery } from "@tanstack/react-query";
import { MobileHeader } from "@/components/MobileHeader";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { Footer } from "@/components/Footer";
import type { Transaction } from "@shared/schema";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import historyPicUrl from "@assets/history pic_1763511883477.png";

export default function HistoryPage() {
  const [, navigate] = useLocation();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Check if user is logged in
  useEffect(() => {
    const userToken = localStorage.getItem("user_token");
    setIsLoggedIn(!!userToken);
  }, []);

  const { data: transactions, isLoading } = useQuery<Transaction[]>({
    queryKey: ["/api/user/transactions"],
    enabled: isLoggedIn,
  });

  const maskPhoneNumber = (phone: string) => {
    if (phone.length <= 6) return phone;
    return phone.slice(0, 4) + "*".repeat(phone.length - 7) + phone.slice(-3);
  };

  return (
    <div className="min-h-screen bg-[#ffffff]">
      <div className="max-w-undifest mx-auto pb-20">
        <MobileHeader />

        <div className="px-4 py-6 bg-[#16202a]">
          <div className="flex items-center justify-between rounded-xl p-4 pt-[0px] pb-[0px] bg-[#2e3e59a8] mt-[15px] mb-[15px]">
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
              <div className="grid grid-cols-5 gap-2 text-black font-bold text-sm">
                <div>Tanggal</div>
                <div>Pemenang</div>
                <div>Nominal (Rp)</div>
                <div>Event</div>
                <div>Status</div>
              </div>
            </div>

            {/* Rows */}
            <div className="divide-y divide-gray-800">
              {!isLoggedIn ? (
                <div className="p-12 text-center">
                  <p className="text-gray-400 text-sm mb-4">Silakan login untuk melihat riwayat transaksi Anda</p>
                  <button
                    onClick={() => navigate("/account")}
                    data-testid="button-login-redirect"
                    className="holographic-btn px-8 py-3 rounded-xl text-lg font-bold"
                  >
                    Login
                  </button>
                </div>
              ) : isLoading ? (
                <div className="p-6 text-center text-gray-400">Loading...</div>
              ) : transactions && transactions.length > 0 ? (
                transactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    data-testid={`transaction-${transaction.id}`}
                    className="grid grid-cols-5 gap-2 p-3 text-white text-sm bg-[#1a2332]/50 hover:bg-[#1a2332] transition-colors"
                  >
                    <div className="font-medium">
                      {new Date(transaction.createdAt).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "2-digit"
                      }).replace(/ /g, ' ')}
                    </div>
                    <div className="font-mono text-xs">{maskPhoneNumber(transaction.phoneNumber)}</div>
                    <div className="font-bold">{transaction.amount.toLocaleString('id-ID')}</div>
                    <div className="truncate">{transaction.eventName || 'Event'}</div>
                    <div>
                      {transaction.paymentStatus === 'paid' ? (
                        <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs">Lunas</span>
                      ) : transaction.paymentStatus === 'pending' ? (
                        transaction.paymentUrl ? (
                          <a
                            href={transaction.paymentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded text-xs hover:bg-yellow-500/30"
                          >
                            Bayar
                          </a>
                        ) : (
                          <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded text-xs">Pending</span>
                        )
                      ) : transaction.paymentStatus === 'expired' ? (
                        <span className="px-2 py-1 bg-gray-500/20 text-gray-400 rounded text-xs">Expired</span>
                      ) : transaction.paymentStatus === 'failed' ? (
                        <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs">Gagal</span>
                      ) : (
                        <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs">Lunas</span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-12 text-center text-gray-400 text-sm">
                  Belum ada transaksi
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
