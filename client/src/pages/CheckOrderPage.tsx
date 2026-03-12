import { useState } from "react";
import { MobileHeader } from "@/components/MobileHeader";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { Search, Download, FileText, Package, AlertCircle, CheckCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface OrderResult {
  transactionId: string;
  eventName: string;
  ticketCount: number;
  amount: number;
  paidAt: string | null;
  hasEbook: boolean;
}

export default function CheckOrderPage() {
  const [phone, setPhone] = useState("");
  const [orders, setOrders] = useState<OrderResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim() || phone.trim().length < 8) {
      setError("Masukkan nomor telepon yang valid (minimal 8 digit)");
      return;
    }
    setLoading(true);
    setError(null);
    setOrders(null);
    try {
      const result = await apiRequest(`/api/orders/lookup?phone=${encodeURIComponent(phone.trim())}`);
      setOrders(result);
      if (result.length === 0) {
        setError("Tidak ada pesanan ditemukan untuk nomor telepon ini.");
      }
    } catch {
      setError("Gagal mencari pesanan. Coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (transactionId: string, eventName: string) => {
    setDownloadingId(transactionId);
    try {
      const res = await apiRequest(`/api/ebook/download/${transactionId}`);
      if (res.success && res.ebookFile) {
        const anchor = document.createElement("a");
        anchor.href = res.ebookFile;
        anchor.download = `${res.ebookTitle || eventName}.pdf`;
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
      }
    } catch {
      alert("Gagal mengunduh e-book. Coba lagi.");
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a1621]">
      <div className="max-w-undifest mx-auto pb-28 bg-[#16202a]">
        <MobileHeader />

        <div className="p-6">
          <div className="mb-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#00D4FF]/10 flex items-center justify-center">
              <Package className="w-8 h-8 text-[#00D4FF]" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Cek Pesanan</h1>
            <p className="text-gray-400 text-sm">
              Masukkan nomor telepon yang digunakan saat pembelian untuk melihat pesanan Anda
            </p>
          </div>

          <form onSubmit={handleSearch} className="mb-6">
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
                Cari
              </button>
            </div>
          </form>

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

