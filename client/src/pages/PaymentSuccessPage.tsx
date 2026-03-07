import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { MobileHeader } from "@/components/MobileHeader";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { CheckCircle, Loader2, Download, FileText } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function PaymentSuccessPage() {
  const [, navigate] = useLocation();
  const [status, setStatus] = useState<"loading" | "success" | "pending" | "error">("loading");
  const [paymentStatus, setPaymentStatus] = useState<string>("");
  const [ebookUrl, setEbookUrl] = useState<string>("");
  const [eventName, setEventName] = useState<string>("");

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
        setEventName(response.eventName || "");

        // Set E-book URL (untuk simulasi, gunakan URL dummy)
        // Nanti bisa diganti dengan URL real dari database
        if (response.paymentStatus === "paid") {
          setEbookUrl("https://drive.google.com/file/d/SAMPLE_EBOOK_ID/view"); // Ganti dengan URL real
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
              <p className="text-gray-400 mb-4">Tiket Anda telah berhasil dibeli.</p>

              {/* E-book Download Section */}
              <div className="w-full max-w-md bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30 rounded-lg p-6 mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <FileText className="w-8 h-8 text-purple-400" />
                  <div className="text-left">
                    <h3 className="text-lg font-bold text-white">E-book Anda Siap!</h3>
                    <p className="text-sm text-gray-400">Unduh sekarang juga</p>
                  </div>
                </div>

                <a
                  href={ebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105"
                >
                  <Download className="w-5 h-5" />
                  Download E-book
                </a>

                <p className="text-xs text-gray-400 mt-3 text-center">
                  Link download juga tersedia di riwayat transaksi Anda
                </p>
              </div>

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

