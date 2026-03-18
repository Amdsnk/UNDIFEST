import { useState, useEffect } from "react";
import { MobileHeader } from "@/components/MobileHeader";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { Search, Download, FileText, Package, AlertCircle, CheckCircle, ShieldCheck } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface OrderResult {
  transactionId: string;
  eventName: string;
  ticketCount: number;
  amount: number;
  paidAt: string | null;
  hasEbook: boolean;
}

type GuestStep = "phone" | "otp";

export default function CheckOrderPage() {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [guestStep, setGuestStep] = useState<GuestStep>("phone");
  const [orders, setOrders] = useState<OrderResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [loggedInUser, setLoggedInUser] = useState<{ name?: string; phoneNumber?: string } | null>(null);
  const [otpCooldown, setOtpCooldown] = useState(0);

  // Auto-load orders if user is logged in
  useEffect(() => {
    try {
      const userData = localStorage.getItem("user_data");
      const userToken = localStorage.getItem("user_token");
      if (userData && userToken) {
        const user = JSON.parse(userData);
        if (user.phoneNumber) {
          setLoggedInUser(user);
          setLoading(true);
          apiRequest(`/api/orders/lookup?phone=${encodeURIComponent(user.phoneNumber)}`)
            .then((result) => {
              setOrders(result);
              if (result.length === 0) setError("Belum ada pesanan yang ditemukan.");
            })
            .catch(() => setError("Gagal memuat pesanan. Coba lagi."))
            .finally(() => setLoading(false));
        }
      }
    } catch {
      // ignore parse errors
    }
  }, []);

  // Countdown timer for OTP cooldown
  useEffect(() => {
    if (otpCooldown <= 0) return;
    const timer = setTimeout(() => setOtpCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [otpCooldown]);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim() || phone.trim().length < 8) {
      setError("Masukkan nomor telepon yang valid (minimal 8 digit)");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await apiRequest("/api/users/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: phone.trim() }),
      });
      setGuestStep("otp");
      setOtpCooldown(60);
    } catch {
      setError("Gagal mengirim OTP. Coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp.trim() || otp.trim().length < 4) {
      setError("Masukkan kode OTP yang valid");
      return;
    }
    setLoading(true);
    setError(null);
    setOrders(null);
    try {
      const result = await apiRequest("/api/orders/verify-otp-and-lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: phone.trim(), otp: otp.trim() }),
      });
      setOrders(result);
      if (result.length === 0) setError("Tidak ada pesanan ditemukan untuk nomor telepon ini.");
    } catch (err: any) {
      setError(err?.message || "Kode OTP tidak valid atau sudah kadaluarsa.");
    } finally {
      setLoading(false);
    }
  };

  const downloadFileUrl = (fileUrl: string, title: string) => {
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
      alert("Gagal mengunduh e-book. Coba lagi.");
    }
  };

  const handleDownload = async (transactionId: string, eventName: string) => {
    setDownloadingId(transactionId);
    try {
      const res = await apiRequest(`/api/ebook/download/${transactionId}`);
      if (res.success && res.ebookFile) {
        downloadFileUrl(res.ebookFile, res.ebookTitle || eventName);
      }
    } catch {
      alert("Gagal mengunduh e-book. Coba lagi.");
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#16202a]">
      <div className="max-w-undifest mx-auto min-h-screen pb-28 bg-[#16202a]">
        <MobileHeader />

        <div className="p-6">
          <div className="mb-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#00D4FF]/10 flex items-center justify-center">
              {!loggedInUser && guestStep === "otp" ? (
                <ShieldCheck className="w-8 h-8 text-[#00D4FF]" />
              ) : (
                <Package className="w-8 h-8 text-[#00D4FF]" />
              )}
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Cek Pesanan</h1>
            <p className="text-gray-400 text-sm">
              {loggedInUser
                ? `Menampilkan pesanan untuk ${loggedInUser.name || loggedInUser.phoneNumber}`
                : guestStep === "otp"
                ? `Kode OTP telah dikirim ke WhatsApp ${phone}`
                : "Masukkan nomor telepon yang digunakan saat pembelian"}
            </p>
          </div>

          {loading && !orders && (
            <div className="flex justify-center py-8">
              <div className="w-8 h-8 border-2 border-[#00D4FF] border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {/* Step 1: Phone number input (guest only) */}
          {!loggedInUser && guestStep === "phone" && (
            <form onSubmit={handleSendOtp} className="mb-6">
              <div className="flex gap-2">
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Contoh: 08123456789"
                  className="flex-1 bg-[#1a2332] border border-[#8B2FC9]/40 text-white placeholder-gray-500 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#00D4FF] transition-colors"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 px-5 py-3 bg-[#00D4FF] hover:bg-[#00b8d9] disabled:opacity-60 text-[#0a1621] font-bold rounded-lg text-sm transition-colors"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-[#0a1621] border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                  Kirim OTP
                </button>
              </div>
            </form>
          )}

          {/* Step 2: OTP verification (guest only) */}
          {!loggedInUser && guestStep === "otp" && !orders && (
            <form onSubmit={handleVerifyOtp} className="mb-6 space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  placeholder="Masukkan 6 digit OTP"
                  className="flex-1 bg-[#1a2332] border border-[#8B2FC9]/40 text-white placeholder-gray-500 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#00D4FF] transition-colors tracking-widest text-center text-lg font-bold"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 px-5 py-3 bg-[#00D4FF] hover:bg-[#00b8d9] disabled:opacity-60 text-[#0a1621] font-bold rounded-lg text-sm transition-colors"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-[#0a1621] border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <ShieldCheck className="w-4 h-4" />
                  )}
                  Verifikasi
                </button>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-400">
                <button
                  type="button"
                  onClick={() => { setGuestStep("phone"); setOtp(""); setError(null); }}
                  className="underline hover:text-gray-200"
                >
                  Ganti nomor
                </button>
                {otpCooldown > 0 ? (
                  <span>Kirim ulang dalam {otpCooldown}s</span>
                ) : (
                  <button
                    type="button"
                    onClick={(e) => { setOtp(""); handleSendOtp(e as any); }}
                    className="underline hover:text-gray-200"
                  >
                    Kirim ulang OTP
                  </button>
                )}
              </div>
            </form>
          )}

          {error && !loading && (
            <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-4">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {orders && orders.length > 0 && (
            <div className="space-y-3">
              <p className="text-gray-400 text-xs mb-4">{orders.length} pesanan ditemukan</p>
              {orders.map((order) => (
                <div
                  key={order.transactionId}
                  className="bg-[#1a2332] border border-[#8B2FC9]/20 rounded-xl p-4"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                        <span className="text-green-400 text-xs font-semibold">Pembayaran Berhasil</span>
                      </div>
                      <h3 className="text-white font-semibold text-sm">{order.eventName}</h3>
                      <p className="text-gray-400 text-xs mt-1">
                        {order.ticketCount} tiket · Rp {order.amount.toLocaleString("id-ID")}
                      </p>
                      {order.paidAt && (
                        <p className="text-gray-500 text-xs mt-0.5">
                          {new Date(order.paidAt).toLocaleDateString("id-ID", {
                            day: "numeric", month: "long", year: "numeric"
                          })}
                        </p>
                      )}
                    </div>
                  </div>

                  {order.hasEbook ? (
                    <button
                      onClick={() => handleDownload(order.transactionId, order.eventName)}
                      disabled={downloadingId === order.transactionId}
                      className="w-full flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-60 text-white font-semibold rounded-lg text-sm transition-all"
                    >
                      {downloadingId === order.transactionId ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Download className="w-4 h-4" />
                      )}
                      Download E-book
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 py-2.5 px-3 bg-gray-700/30 rounded-lg">
                      <FileText className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-500 text-sm">Event ini tidak memiliki e-book</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <MobileBottomNav />
      </div>
    </div>
  );
}

