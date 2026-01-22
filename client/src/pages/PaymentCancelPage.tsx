import { useLocation } from "wouter";
import { MobileHeader } from "@/components/MobileHeader";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { XCircle } from "lucide-react";

export default function PaymentCancelPage() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-[#0a1621]">
      <div className="max-w-undifest mx-auto pb-20 bg-[#16202a]">
        <MobileHeader />

        <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
          <XCircle className="w-20 h-20 text-red-500 mb-6" />
          <h1 className="text-2xl font-bold text-white mb-2">Pembayaran Dibatalkan</h1>
          <p className="text-gray-400 mb-6">
            Anda telah membatalkan proses pembayaran. Tiket tidak dibeli.
          </p>
          <div className="flex gap-4">
            <button
              onClick={() => navigate("/")}
              className="px-8 py-3 rounded-lg border-2 border-[#8B2FC9] text-[#8B2FC9] font-bold hover:bg-[#8B2FC9]/10"
            >
              Kembali ke Beranda
            </button>
            <button
              onClick={() => navigate("/history")}
              className="holographic-btn px-8 py-3 rounded-lg font-bold"
            >
              Lihat Riwayat
            </button>
          </div>
        </div>

        <MobileBottomNav />
      </div>
    </div>
  );
}

