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
  const [ebookData, setEbookData] = useState<{ file: string; title: string } | null>(null);
  const [eventName, setEventName] = useState<string>("");
  const [transactionId, setTransactionId] = useState<string>("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const trxId = params.get("trx");

    if (!trxId) {
      setStatus("error");
      return;
    }

    setTransactionId(trxId);

    // Check payment status
    const checkStatus = async () => {
      try {
        // Optional: include user token if available
        const userToken = localStorage.getItem("user_token");
        const headers: Record<string, string> = {};
        if (userToken) {
          headers["Authorization"] = `Bearer ${userToken}`;
        }

        const response = await apiRequest(`/api/payments/status/${trxId}`, {
          headers
        });

        setPaymentStatus(response.paymentStatus);
        setEventName(response.eventName || "");

        // If payment is successful, fetch E-book data
        if (response.paymentStatus === "paid") {
          try {
            const ebookResponse = await apiRequest(`/api/ebook/download/${trxId}`);
            if (ebookResponse.success && ebookResponse.ebookFile) {
              setEbookData({
                file: ebookResponse.ebookFile,
                title: ebookResponse.ebookTitle || "E-book"
              });
            }
          } catch (ebookError) {
            console.log("E-book not available for this event");
          }
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

              {/* E-book Download Section - Only show if E-book is available */}
              {ebookData && (
                <div className="w-full max-w-md bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30 rounded-lg p-6 mb-6">
                  <div className="flex items-center gap-3 mb-4">
                    <FileText className="w-8 h-8 text-purple-400" />
                    <div className="text-left">
                      <h3 className="text-lg font-bold text-white">E-book Anda Siap!</h3>
                      <p className="text-sm text-gray-400">{ebookData.title}</p>
                    </div>
                  </div>

                  <a
                    href={ebookData.file}
                    download={`${ebookData.title}.pdf`}
                    className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105"
                  >
                    <Download className="w-5 h-5" />
                    Download E-book
                  </a>

                  <p className="text-xs text-gray-400 mt-3 text-center">
                    Link download juga tersedia di riwayat transaksi Anda
                  </p>
                </div>
              )}

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

