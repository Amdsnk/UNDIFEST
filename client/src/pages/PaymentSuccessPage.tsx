import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { MobileHeader } from "@/components/MobileHeader";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { CheckCircle, Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function PaymentSuccessPage() {
  const [, navigate] = useLocation();
  const [status, setStatus] = useState<"loading" | "success" | "pending" | "error">("loading");
  const [paymentStatus, setPaymentStatus] = useState<string>("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const trxId = params.get("trx");

    if (!trxId) {
      setStatus("error");
      return;
    }

    // Check payment status
    const checkStatus = async () => {
      try {
        const userToken = localStorage.getItem("user_token");
        if (!userToken) {
          setStatus("error");
          return;
        }

        const response = await apiRequest(`/api/payments/status/${trxId}`, {
          headers: {
            "Authorization": `Bearer ${userToken}`
          }
        });

        setPaymentStatus(response.paymentStatus);
        if (response.paymentStatus === "paid") {
          setStatus("success");
        } else if (response.paymentStatus === "pending") {
          setStatus("pending");
        } else {
          setStatus("error");
        }
      } catch (error) {
        console.error("Error checking payment status:", error);
        setStatus("error");
      }
    };

    checkStatus();
  }, []);

  return (
    <div className="min-h-screen bg-[#0a1621]">
      <div className="max-w-undifest mx-auto pb-20 bg-[#16202a]">
        <MobileHeader />

        <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
          {status === "loading" && (
            <>
              <Loader2 className="w-20 h-20 text-[#00D4FF] animate-spin mb-6" />
              <h1 className="text-2xl font-bold text-white mb-2">Memverifikasi Pembayaran</h1>
              <p className="text-gray-400">Mohon tunggu sebentar...</p>
            </>
          )}

          {status === "success" && (
            <>
              <CheckCircle className="w-20 h-20 text-green-500 mb-6" />
              <h1 className="text-2xl font-bold text-white mb-2">Pembayaran Berhasil!</h1>
              <p className="text-gray-400 mb-6">Tiket Anda telah berhasil dibeli.</p>
              <button
                onClick={() => navigate("/history")}
                className="holographic-btn px-8 py-3 rounded-lg font-bold"
              >
                Lihat Riwayat Transaksi
              </button>
            </>
          )}

          {status === "pending" && (
            <>
              <Loader2 className="w-20 h-20 text-yellow-500 mb-6" />
              <h1 className="text-2xl font-bold text-white mb-2">Menunggu Pembayaran</h1>
              <p className="text-gray-400 mb-6">
                Pembayaran Anda sedang diproses. Silakan selesaikan pembayaran jika belum.
              </p>
              <button
                onClick={() => navigate("/history")}
                className="holographic-btn px-8 py-3 rounded-lg font-bold"
              >
                Lihat Riwayat Transaksi
              </button>
            </>
          )}

          {status === "error" && (
            <>
              <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center mb-6">
                <span className="text-4xl">❌</span>
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">Terjadi Kesalahan</h1>
              <p className="text-gray-400 mb-6">
                Tidak dapat memverifikasi pembayaran. Silakan cek riwayat transaksi Anda.
              </p>
              <button
                onClick={() => navigate("/history")}
                className="holographic-btn px-8 py-3 rounded-lg font-bold"
              >
                Lihat Riwayat Transaksi
              </button>
            </>
          )}
        </div>

        <MobileBottomNav />
      </div>
    </div>
  );
}

