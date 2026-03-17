import { useEffect, useState, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { MobileHeader } from "@/components/MobileHeader";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { CheckCircle, Loader2, Download, FileText, Link2, Copy, Check } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

const MAX_POLL_ATTEMPTS = 40; // 40 × 3s = 2 minutes
const POLL_INTERVAL_MS = 3000;

export default function PaymentSuccessPage() {
  const [, navigate] = useLocation();
  const [status, setStatus] = useState<"loading" | "success" | "pending" | "error">("loading");
  const [ebookData, setEbookData] = useState<{ file: string; title: string } | null>(null);
  const [eventName, setEventName] = useState<string>("");
  const [transactionId, setTransactionId] = useState<string>("");
  const [pollAttempt, setPollAttempt] = useState(0);
  const [copied, setCopied] = useState(false);
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasDownloadedRef = useRef(false);

  const successPageUrl = typeof window !== "undefined"
    ? `${window.location.origin}/payment/success?trx=${transactionId}`
    : "";

  const handleCopyLink = () => {
    navigator.clipboard.writeText(successPageUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  /**
   * Convert a base64 data URL to a Blob object URL and trigger download.
   * Browsers block auto-download of large base64 data URLs for security reasons,
   * but Blob object URLs are allowed.
   */
  const downloadFileUrl = useCallback((fileUrl: string, title: string) => {
    try {
      if (fileUrl.startsWith("data:")) {
        const [header, base64Data] = fileUrl.split(",");
        const mimeType = header.match(/:(.*?);/)?.[1] || "application/pdf";
        const byteCharacters = atob(base64Data);
        const byteArray = new Uint8Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteArray[i] = byteCharacters.charCodeAt(i);
        }
        const blob = new Blob([byteArray], { type: mimeType });
        const objectUrl = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = objectUrl;
        anchor.download = `${title}.pdf`;
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
        setTimeout(() => URL.revokeObjectURL(objectUrl), 10000);
      } else {
        const anchor = document.createElement("a");
        anchor.href = fileUrl;
        anchor.download = `${title}.pdf`;
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
      }
    } catch (err) {
      console.error("Download failed:", err);
    }
  }, []);

  const triggerAutoDownload = useCallback((fileUrl: string, title: string) => {
    if (hasDownloadedRef.current) return;
    hasDownloadedRef.current = true;
    downloadFileUrl(fileUrl, title);
  }, [downloadFileUrl]);

  const fetchEbook = useCallback(async (trxId: string): Promise<{ file: string; title: string } | null> => {
    try {
      const ebookResponse = await apiRequest(`/api/ebook/download/${trxId}`);
      if (ebookResponse.success && ebookResponse.ebookFile) {
        return { file: ebookResponse.ebookFile, title: ebookResponse.ebookTitle || "E-book" };
      }
    } catch {
      console.log("E-book not available for this event");
    }
    return null;
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const trxId = params.get("trx");

    if (!trxId) {
      setStatus("error");
      return;
    }

    setTransactionId(trxId);

    const checkStatus = async (attempt: number) => {
      try {
        const userToken = localStorage.getItem("user_token");
        const headers: Record<string, string> = {};
        if (userToken) headers["Authorization"] = `Bearer ${userToken}`;

        const response = await apiRequest(`/api/payments/status/${trxId}`, { headers });

        setEventName(response.eventName || "");
        setPollAttempt(attempt);

        if (response.paymentStatus === "paid") {
          // Payment confirmed — fetch ebook and auto-download
          const ebook = await fetchEbook(trxId);
          setEbookData(ebook);
          setStatus("success");
          if (ebook) {
            triggerAutoDownload(ebook.file, ebook.title);
          }
        } else if (
          response.paymentStatus === "pending" &&
          attempt < MAX_POLL_ATTEMPTS
        ) {
          // Still pending — keep polling
          setStatus("pending");
          pollTimerRef.current = setTimeout(() => checkStatus(attempt + 1), POLL_INTERVAL_MS);
        } else if (response.paymentStatus === "pending") {
          // Timed out
          setStatus("pending");
        } else {
          setStatus("error");
        }
      } catch (error) {
        console.error("Error checking payment status:", error);
        if (attempt < MAX_POLL_ATTEMPTS) {
          pollTimerRef.current = setTimeout(() => checkStatus(attempt + 1), POLL_INTERVAL_MS);
        } else {
          setStatus("error");
        }
      }
    };

    checkStatus(0);

    return () => {
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
    };
  }, [fetchEbook, triggerAutoDownload]);

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

                  <button
                    onClick={() => downloadFileUrl(ebookData.file, ebookData.title)}
                    className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105"
                  >
                    <Download className="w-5 h-5" />
                    Download E-book
                  </button>

                  <p className="text-xs text-gray-400 mt-3 text-center">
                    Download otomatis dimulai. Klik tombol di atas jika belum terunduh.
                  </p>
                </div>
              )}

              {/* Save Download Link Box - for guests without account */}
              <div className="w-full max-w-md bg-[#1a2332] border border-[#00D4FF]/30 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <Link2 className="w-4 h-4 text-[#00D4FF]" />
                  <p className="text-sm font-semibold text-[#00D4FF]">Simpan Link Download Anda</p>
                </div>
                <p className="text-xs text-gray-400 mb-3">
                  Belum punya akun? Simpan link ini — buka kapan saja untuk download ulang e-book Anda.
                </p>
                <div className="flex items-center gap-2 bg-[#0a1621] rounded-md p-2">
                  <span className="text-xs text-gray-300 flex-1 truncate">{successPageUrl}</span>
                  <button
                    onClick={handleCopyLink}
                    className="flex-shrink-0 flex items-center gap-1 px-3 py-1 bg-[#00D4FF]/20 hover:bg-[#00D4FF]/30 text-[#00D4FF] rounded text-xs font-semibold transition-colors"
                  >
                    {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    {copied ? "Tersalin!" : "Salin"}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Atau gunakan{" "}
                  <a href="/cek-pesanan" className="text-[#00D4FF] underline">
                    Cek Pesanan
                  </a>{" "}
                  dengan nomor telepon Anda
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

