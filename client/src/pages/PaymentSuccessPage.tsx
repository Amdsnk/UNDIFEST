import { useEffect, useState, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { MobileHeader } from "@/components/MobileHeader";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { CheckCircle, Loader2, Download, FileText, Link2, Copy, Check } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

const MAX_POLL_ATTEMPTS = 40; // 40 × 3s = 2 minutes (only used for non-redirect flow)
const POLL_INTERVAL_MS = 3000;

export default function PaymentSuccessPage() {
  const [, navigate] = useLocation();
  const [status, setStatus] = useState<"loading" | "success" | "pending" | "error">("loading");
  const [ebookData, setEbookData] = useState<{ file: string; title: string } | null>(null);
  const [eventName, setEventName] = useState<string>("");
  const [transactionId, setTransactionId] = useState<string>("");
  const [pollAttempt, setPollAttempt] = useState(0);
  const [copied, setCopied] = useState(false);
  const [txAmount, setTxAmount] = useState<number>(0);
  const [txTicketCount, setTxTicketCount] = useState<number>(1);
  const [txDate, setTxDate] = useState<string>("");
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

    // PENTING: Midtrans terkadang menambahkan ?status_code=200 dengan tanda tanya GANDA
    // Contoh: /payment/success?trx=xxx?status_code=200 (seharusnya &status_code=200)
    // Akibatnya params.get("trx") menjadi "xxx?status_code=200" dan status_code = null
    // Fix: bersihkan trxId dari suffix ?... dan cek status_code dari full URL
    let trxId =
      params.get("trx") ||
      params.get("order_id") ||
      sessionStorage.getItem("pending_transaction_id");
    // Bersihkan jika ada ?status_code=200 yang nempel di trxId
    if (trxId) trxId = trxId.split("?")[0];

    const fullHref = window.location.href;
    const midtransStatus = params.get("transaction_status");
    // Cek status_code dari URLSearchParams ATAU dari full URL (handle double-? bug)
    const midtransStatusCode =
      params.get("status_code") ||
      (fullHref.includes("status_code=200") ? "200" : null);

    if (!trxId) {
      setStatus("error");
      return;
    }

    sessionStorage.removeItem("pending_transaction_id");
    setTransactionId(trxId);

    // ─────────────────────────────────────────────────────────────
    // ALUR 1: Redirect dari Midtrans dengan konfirmasi pembayaran
    // Midtrans hanya redirect ke finishUrl dengan status_code=200
    // atau transaction_status=settlement/capture setelah user BENAR-BENAR bayar.
    // Tidak perlu verifikasi ulang — langsung tandai lunas & tampilkan download.
    // ─────────────────────────────────────────────────────────────
    const isConfirmedByMidtrans =
      midtransStatus === "settlement" ||
      midtransStatus === "capture" ||
      midtransStatusCode === "200";

    if (isConfirmedByMidtrans) {
      // Tampilkan halaman sukses SEKETIKA — tanpa loading
      setStatus("success");

      // Di background: tandai lunas di DB + ambil info event & ebook
      const confirmAndFetch = async () => {
        try {
          const confirmResp = await apiRequest(`/api/payments/confirm-paid/${trxId}`, {
            method: "POST",
          });
          if (confirmResp.eventName) setEventName(confirmResp.eventName);
          if (confirmResp.amount) setTxAmount(confirmResp.amount);
          if (confirmResp.ticketCount) setTxTicketCount(confirmResp.ticketCount);
          if (confirmResp.createdAt) {
            const d = new Date(confirmResp.createdAt);
            setTxDate(d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }));
          }
        } catch (e) {
          console.error("[PaymentSuccess] confirm-paid failed (non-fatal):", e);
        }

        // Ambil file ebook
        try {
          const ebook = await fetchEbook(trxId);
          if (ebook) {
            setEbookData(ebook);
            triggerAutoDownload(ebook.file, ebook.title);
          }
        } catch (e) {
          console.error("[PaymentSuccess] ebook fetch failed (non-fatal):", e);
        }
      };

      confirmAndFetch();
      return;
    }

    // ─────────────────────────────────────────────────────────────
    // ALUR 2: User membuka link tersimpan (tanpa param Midtrans)
    // Polling untuk cek apakah transaksi sudah dibayar sebelumnya
    // ─────────────────────────────────────────────────────────────
    const checkStatus = async (attempt: number) => {
      try {
        const userToken = localStorage.getItem("user_token");
        const headers: Record<string, string> = {};
        if (userToken) headers["Authorization"] = `Bearer ${userToken}`;

        const response = await apiRequest(`/api/payments/status/${trxId}`, { headers });

        setEventName(response.eventName || "");
        if (response.amount) setTxAmount(response.amount);
        if (response.ticketCount) setTxTicketCount(response.ticketCount);
        if (response.createdAt) {
          const d = new Date(response.createdAt);
          setTxDate(d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }));
        }
        setPollAttempt(attempt);

        if (response.paymentStatus === "paid") {
          const ebook = await fetchEbook(trxId);
          setEbookData(ebook);
          setStatus("success");
          if (ebook) triggerAutoDownload(ebook.file, ebook.title);
        } else if (response.paymentStatus === "pending" && attempt < MAX_POLL_ATTEMPTS) {
          setStatus("pending");
          pollTimerRef.current = setTimeout(() => checkStatus(attempt + 1), POLL_INTERVAL_MS);
        } else if (response.paymentStatus === "failed" || response.paymentStatus === "expired") {
          setStatus("error");
        } else {
          setStatus("pending");
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
              {/* Main success card */}
              <div className="w-full max-w-md bg-[#1a2332] border border-green-500/30 rounded-2xl p-6 mb-6 text-left">
                {/* Header */}
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                  <span className="text-green-400 font-semibold text-sm">Pembayaran Berhasil</span>
                </div>

                {/* Event name */}
                <h1 className="text-xl font-bold text-white mb-3 leading-snug">
                  {eventName || "Tiket Event"}
                </h1>

                {/* Nomor Undian — ditampilkan langsung di web */}
                {transactionId && (
                  <div className="bg-[#0a1621] border border-[#00D4FF]/30 rounded-lg px-4 py-3 mb-4">
                    <p className="text-xs text-gray-500 mb-1">🎟️ Nomor Undian / Order ID</p>
                    <p className="text-base font-mono font-bold text-[#00D4FF] tracking-wider">
                      UND-{transactionId.slice(0, 8).toUpperCase()}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Simpan nomor ini sebagai bukti keikutsertaan undian</p>
                  </div>
                )}

                {/* Transaction details */}
                <div className="text-sm text-gray-400 space-y-1 mb-5">
                  {txTicketCount > 0 && txAmount > 0 && (
                    <p>{txTicketCount} tiket · Rp {txAmount.toLocaleString("id-ID")}</p>
                  )}
                  {txDate && <p>{txDate}</p>}
                </div>

                {/* E-book download button — only if ebook available */}
                {ebookData ? (
                  <>
                    <button
                      onClick={() => downloadFileUrl(ebookData.file, ebookData.title)}
                      className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white font-bold py-4 px-6 rounded-xl transition-all duration-200 transform hover:scale-[1.02] text-base"
                    >
                      <Download className="w-5 h-5" />
                      Download E-book
                    </button>
                    <p className="text-xs text-gray-500 mt-2 text-center">
                      Download otomatis dimulai. Klik tombol jika belum terunduh.
                    </p>
                  </>
                ) : (
                  <div className="flex items-center gap-2 text-gray-400 text-sm">
                    <FileText className="w-4 h-4" />
                    <span>Tiket Anda sudah aktif</span>
                  </div>
                )}
              </div>

              {/* Save Download Link Box */}
              <div className="w-full max-w-md bg-[#0f1923] border border-[#00D4FF]/20 rounded-xl p-4 mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Link2 className="w-4 h-4 text-[#00D4FF]" />
                  <p className="text-sm font-semibold text-[#00D4FF]">Simpan Link Download</p>
                </div>
                <p className="text-xs text-gray-400 mb-3">
                  Simpan link ini — buka kapan saja untuk download ulang e-book Anda tanpa perlu login.
                </p>
                <div className="flex items-center gap-2 bg-[#0a1621] rounded-lg p-2">
                  <span className="text-xs text-gray-300 flex-1 truncate">{successPageUrl}</span>
                  <button
                    onClick={handleCopyLink}
                    className="flex-shrink-0 flex items-center gap-1 px-3 py-1 bg-[#00D4FF]/20 hover:bg-[#00D4FF]/30 text-[#00D4FF] rounded text-xs font-semibold transition-colors"
                  >
                    {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    {copied ? "Tersalin!" : "Salin"}
                  </button>
                </div>
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
              <div className="w-20 h-20 rounded-full bg-yellow-500/20 flex items-center justify-center mb-6">
                <span className="text-4xl">⚠️</span>
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">Tidak Dapat Verifikasi</h1>
              <p className="text-gray-400 mb-2">
                Halaman ini tidak dapat menemukan data transaksi Anda secara otomatis.
              </p>
              <p className="text-gray-400 mb-6">
                Jika Anda sudah bayar, gunakan <strong className="text-[#00D4FF]">Cek Pesanan</strong> dengan nomor HP Anda untuk melihat status dan link download e-book.
              </p>
              <button
                onClick={() => navigate("/cek-pesanan")}
                className="holographic-btn px-8 py-3 rounded-lg font-bold mb-3"
              >
                Cek Pesanan Saya
              </button>
              <button
                onClick={() => navigate("/history")}
                className="text-gray-400 underline text-sm"
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

