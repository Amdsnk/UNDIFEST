import { useQuery } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { MobileHeader } from "@/components/MobileHeader";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import BuyerDataForm from "@/components/BuyerDataForm";
import type { Event, TermsCondition } from "@shared/schema";
import { useState } from "react";
import { Copy, Check, ThumbsUp, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import undian01Url from "@assets/undian01_1763489504866.png";
import undian02Url from "@assets/undian02_1763489504867.png";
import qrisIconUrl from "@assets/qris_default.png";

interface PaymentDetails {
  paymentNo: string;
  paymentName: string;
  total: number;
  fee: number;
  expired: string;
  qrImage?: string;
  via: string;
  channel: string;
  transactionId?: string;
  simulationMode?: boolean;
}

interface BuyerData {
  name: string;
  phone: string;
  email: string;
}

export default function PaymentPage() {
  const [, params] = useRoute("/payment/:eventId");
  const eventId = params?.eventId;
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'qris' | null>(null);
  const [paymentChannel, setPaymentChannel] = useState<string>('');
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails | null>(null);
  const [copied, setCopied] = useState(false);
  const [showBuyerForm, setShowBuyerForm] = useState(false);
  const [buyerData, setBuyerData] = useState<BuyerData | null>(null);

  // Dual undian / custom amount support
  const searchParams = new URLSearchParams(window.location.search);
  const undianType = searchParams.get("undian"); // "A" | "B" | null
  // amount pre-passed from TebakUndianPage — if present, skip the custom amount step
  const preAmount = searchParams.get("amount");
  const [customAmount, setCustomAmount] = useState<string>(preAmount || "");
  const [customAmountConfirmed, setCustomAmountConfirmed] = useState(!!preAmount);

  const { data: event, isLoading: eventLoading } = useQuery<Event>({
    queryKey: ["/api/events", eventId],
    enabled: !!eventId,
  });

  // Fetch terms & conditions for the event
  const { data: terms = [] } = useQuery<TermsCondition[]>({
    queryKey: [`/api/events/${eventId}/terms`],
    enabled: !!eventId,
  });

  // Helper to get event card image based on cardTemplate or fallback to bannerUndian/imageUrl
  const getEventCardImage = (event: Event) => {
    if (event.cardTemplate === "burgerKing") {
      return undian01Url;
    } else if (event.cardTemplate === "yamahaNmax") {
      return undian02Url;
    }
    // If dual undian and a payment-specific image was uploaded, use that first
    if (undianType === "A" && (event as any).undianAPaymentImage) {
      return (event as any).undianAPaymentImage;
    }
    if (undianType === "B" && (event as any).undianBPaymentImage) {
      return (event as any).undianBPaymentImage;
    }
    // Prefer bannerUndian (specific to the undian/payment page),
    // fall back to imageUrl (same as bannerHomepage) if no undian banner is set
    return (event as any).bannerUndian || event.imageUrl;
  };

  const handlePaymentMethodSelect = (method: 'va' | 'qris' | 'directdebit' | 'cstore', channel: string) => {
    if (!event || isProcessing) return;

    // FB Pixel: inject <script> AddPaymentInfo ke document.head
    const script = document.createElement('script');
    script.innerHTML = "fbq('track', 'AddPaymentInfo');";
    document.head.appendChild(script);

    // Set payment method and channel, then show buyer form
    setPaymentMethod(method);
    setPaymentChannel(channel);
    setShowBuyerForm(true);
  };

  const handleBuyerDataSubmit = async (data: BuyerData) => {
    if (!event || isProcessing) return;

    setIsProcessing(true);
    setBuyerData(data);

    const userToken = localStorage.getItem("user_token");
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (userToken) {
      headers["Authorization"] = `Bearer ${userToken}`;
    }

    try {
      console.log("Creating Midtrans payment with:", {
        eventId: event.id,
        amount: event.price,
        eventName: event.name,
        paymentMethod,
        paymentChannel,
        buyerName: data.name,
        buyerPhone: data.phone,
        buyerEmail: data.email,
      });

      // Determine Midtrans endpoint based on payment method
      const midtransEndpoint = paymentMethod === 'qris'
        ? "/api/transactions/midtrans/qris"
        : "/api/transactions/midtrans/va";

      const finalAmount = (event as any).allowCustomAmount && customAmountConfirmed && customAmount
        ? parseInt(customAmount.replace(/\D/g, ""))
        : event.price;

      const response = await fetch(midtransEndpoint, {
        method: "POST",
        headers,
        body: JSON.stringify({
          eventId: event.id,
          amount: finalAmount,
          eventName: event.name,
          paymentChannel: paymentChannel,
          buyerName: data.name,
          buyerPhone: data.phone,
          buyerEmail: data.email,
          undianType: undianType || undefined,
        }),
      });

      console.log("Response status:", response.status);
      const responseData = await response.json();
      console.log("Response data:", responseData);

      if (!response.ok) {
        toast({
          variant: "destructive",
          title: "Pembayaran Gagal",
          description: responseData.message || responseData.paymentError || "Gagal membuat pembayaran. Silakan coba lagi.",
        });
        setIsProcessing(false);
        return;
      }

      if (responseData.redirectUrl) {
        // Production mode: redirect to Midtrans Snap/Payment Link hosted page
        // Simpan transaction ID di sessionStorage sebelum redirect
        // agar success page bisa menemukan transaksi meski Midtrans tidak mengirim ?trx= di URL redirect
        if (responseData.id) {
          sessionStorage.setItem("pending_transaction_id", responseData.id);
        }
        toast({
          title: "Mengarahkan ke Halaman Pembayaran",
          description: "Anda akan diarahkan ke halaman pembayaran Midtrans...",
        });
        window.location.href = responseData.redirectUrl;
        return;
      } else if (responseData.paymentNo || responseData.qrImage) {
        // Simulation mode: show payment details inline
        setPaymentDetails({
          paymentNo: responseData.paymentNo || '',
          paymentName: responseData.paymentName || (responseData.channel === 'QRIS' ? 'QRIS' : ''),
          total: responseData.total || event.price,
          fee: responseData.fee || 0,
          expired: responseData.expired || '',
          qrImage: responseData.qrImage,
          via: responseData.via || '',
          channel: responseData.channel || '',
          transactionId: responseData.id,
          simulationMode: responseData.simulationMode,
        });
        toast({
          title: "Pembayaran Dibuat",
          description: "Silakan selesaikan pembayaran Anda.",
        });
        setIsProcessing(false);
      } else if (responseData.paymentError) {
        toast({
          variant: "destructive",
          title: "Pembayaran Gagal",
          description: responseData.paymentError,
        });
        setIsProcessing(false);
      } else {
        toast({
          variant: "destructive",
          title: "Pembayaran Gagal",
          description: "Gagal membuat pembayaran. Silakan coba lagi.",
        });
        setIsProcessing(false);
      }
    } catch (err: any) {
      console.error("Transaction creation error:", err);
      toast({
        variant: "destructive",
        title: "Terjadi Kesalahan",
        description: err.message || "Silakan coba lagi.",
      });
      setIsProcessing(false);
    }
  };

  const handleBackFromBuyerForm = () => {
    setShowBuyerForm(false);
    setPaymentMethod(null);
    setPaymentChannel('');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast({
      title: "Berhasil Disalin",
      description: "Nomor pembayaran telah disalin ke clipboard.",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  if (eventLoading) {
    return (
      <div className="min-h-screen bg-[#16202a]">
        <div className="max-w-undifest mx-auto">
          <MobileHeader />
          <div className="p-8 text-center text-white">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[#00D4FF] mx-auto mb-4"></div>
            <p>Memuat data event...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-[#16202a]">
        <div className="max-w-undifest mx-auto">
          <MobileHeader />
          <div className="p-8 text-center text-white">
            <p className="text-red-400 mb-4">Event tidak ditemukan</p>
            <button
              onClick={() => navigate("/")}
              className="bg-[#00D4FF] text-white px-6 py-2 rounded-lg"
            >
              Kembali ke Beranda
            </button>
          </div>
        </div>
      </div>
    );
  }

  const cardImageUrl = getEventCardImage(event);

  return (
    <div className="min-h-screen bg-[#ffffff]">
      <div className="max-w-undifest mx-auto min-h-screen pb-44 bg-[#16202a]">
        <MobileHeader />

        {/* Event Title - Only show if not in payment details view */}
        {!paymentDetails && (
          <div className="px-4 pt-4 pb-2">
            <h2 className="text-white text-lg font-bold">{event.name}</h2>
          </div>
        )}

        {/* Undian type badge */}
        {undianType && !paymentDetails && (
          <div className="px-4 pb-1">
            <span
              className="inline-block text-xs font-bold px-3 py-1 rounded-full text-white"
              style={{ background: undianType === "A" ? "linear-gradient(135deg,#7c3aed,#4f46e5)" : "linear-gradient(135deg,#db2777,#9333ea)" }}
            >
              {undianType === "A"
                ? ((event as any)?.undianALabel || "Undian A")
                : ((event as any)?.undianBLabel || "Undian B")}
            </span>
          </div>
        )}

        {/* Custom Amount Step */}
        {!paymentDetails && (event as any)?.allowCustomAmount && !customAmountConfirmed && (
          <div className="px-4 py-4">
            <div className="bg-[#1a2332] rounded-2xl p-5 space-y-4">
              <h3 className="text-white text-lg font-bold">Masukkan Nominal Undian</h3>
              <p className="text-gray-400 text-sm">
                Minimal Rp {event!.price.toLocaleString("id-ID")}
              </p>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 font-semibold">Rp</span>
                <input
                  type="number"
                  min={event!.price}
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  placeholder={event!.price.toString()}
                  className="w-full pl-12 pr-4 py-3 bg-[#0d1520] border border-gray-600 rounded-xl text-white text-lg font-semibold focus:outline-none focus:border-[#7c3aed]"
                />
              </div>
              <button
                onClick={() => {
                  const val = parseInt(customAmount || "0");
                  if (val < event!.price) {
                    toast({
                      variant: "destructive",
                      title: "Nominal Kurang",
                      description: `Minimal Rp ${event!.price.toLocaleString("id-ID")}`,
                    });
                    return;
                  }
                  setCustomAmountConfirmed(true);
                }}
                className="w-full py-3 rounded-xl font-bold text-white text-base"
                style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)" }}
              >
                Lanjutkan
              </button>
            </div>
          </div>
        )}

        {/* Payment Details or Payment Method Selection */}
        {!paymentDetails && (event as any)?.allowCustomAmount && !customAmountConfirmed ? null : paymentDetails ? (
          /* Payment Details Display */
          <div className="px-4 py-4 space-y-4">
            {/* QR Code for QRIS */}
            {paymentDetails.qrImage && (
              <div className="bg-white p-4 rounded-xl text-center">
                <p className="text-gray-700 font-semibold mb-3">Scan QR Code untuk membayar</p>
                <img src={paymentDetails.qrImage} alt="QR Code QRIS" className="w-full max-w-xs mx-auto" />
                <p className="text-gray-500 text-xs mt-2">Gunakan aplikasi apapun yang mendukung QRIS</p>
              </div>
            )}

            {/* Payment Number (VA only) */}
            {paymentDetails.paymentNo && (
              <div className="bg-[#1a2332] p-4 rounded-xl">
                <p className="text-gray-400 text-sm mb-2">Nomor Virtual Account</p>
                <div className="flex items-center justify-between">
                  <p className="text-white text-lg font-mono font-bold">{paymentDetails.paymentNo}</p>
                  <button
                    onClick={() => copyToClipboard(paymentDetails.paymentNo)}
                    className="p-2 hover:bg-[#00D4FF]/20 rounded-lg transition-colors"
                  >
                    {copied ? (
                      <Check className="w-5 h-5 text-green-400" />
                    ) : (
                      <Copy className="w-5 h-5 text-[#00D4FF]" />
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Payment Info */}
            <div className="bg-[#1a2332] p-4 rounded-xl space-y-2">
              {paymentDetails.paymentName && (
                <div className="flex justify-between">
                  <span className="text-gray-400 text-sm">Bank/Metode</span>
                  <span className="text-white text-sm font-bold">{paymentDetails.paymentName}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-400 text-sm">Total</span>
                <span className="text-white text-sm font-bold">Rp {paymentDetails.total.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400 text-sm">Biaya Admin</span>
                <span className="text-white text-sm">Rp {paymentDetails.fee.toLocaleString()}</span>
              </div>
              {paymentDetails.expired && (
                <div className="flex justify-between">
                  <span className="text-gray-400 text-sm">Berlaku Hingga</span>
                  <span className="text-white text-sm">{new Date(paymentDetails.expired).toLocaleString("id-ID")}</span>
                </div>
              )}
            </div>

            {/* Instructions */}
            <div className="bg-[#1a2332] p-4 rounded-xl">
              <p className="text-gray-400 text-sm mb-2">Instruksi Pembayaran</p>
              {paymentDetails.channel === 'QRIS' ? (
                <ol className="text-white text-sm space-y-1 list-decimal list-inside">
                  <li>Buka aplikasi dompet digital (GoPay, OVO, DANA, dll.)</li>
                  <li>Pilih menu "Bayar" atau "Scan QR"</li>
                  <li>Scan QR Code di atas</li>
                  <li>Konfirmasi jumlah pembayaran</li>
                  <li>Selesaikan pembayaran</li>
                </ol>
              ) : (
                <ol className="text-white text-sm space-y-1 list-decimal list-inside">
                  <li>Salin nomor Virtual Account di atas</li>
                  <li>Buka aplikasi mobile banking atau ATM</li>
                  <li>Pilih menu transfer ke {paymentDetails.paymentName || 'Virtual Account'}</li>
                  <li>Masukkan nomor Virtual Account</li>
                  <li>Konfirmasi pembayaran</li>
                </ol>
              )}
            </div>

            {/* Simulation Mode - Test Payment Button */}
            {paymentDetails.simulationMode && (
              <div className="bg-yellow-900/30 border-2 border-yellow-500 p-4 rounded-xl">
                <p className="text-yellow-400 text-sm font-bold mb-2">🧪 MODE SIMULASI</p>
                <p className="text-yellow-200 text-xs mb-3">
                  Klik tombol di bawah untuk simulasi pembayaran berhasil (untuk testing)
                </p>
                <button
                  onClick={async () => {
                    try {
                      const response = await fetch(`/api/transactions/${paymentDetails.transactionId}/simulate-payment`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ status: 'paid' }),
                      });

                      if (response.ok) {
                        toast({
                          title: "✅ Pembayaran Disimulasikan",
                          description: "Redirect ke halaman sukses...",
                        });
                        setTimeout(() => {
                          navigate(`/payment/success?trx=${paymentDetails.transactionId}`);
                        }, 1000);
                      } else {
                        toast({
                          variant: "destructive",
                          title: "Simulasi Gagal",
                          description: "Terjadi kesalahan saat simulasi pembayaran",
                        });
                      }
                    } catch (error) {
                      toast({
                        variant: "destructive",
                        title: "Error",
                        description: "Gagal melakukan simulasi pembayaran",
                      });
                    }
                  }}
                  className="w-full bg-yellow-500 hover:bg-yellow-600 text-black py-3 rounded-lg font-bold transition-colors"
                >
                  🧪 Simulasi Pembayaran Berhasil
                </button>
              </div>
            )}

            {/* Back Button */}
            <button
              onClick={() => navigate("/")}
              className="w-full bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-lg font-bold transition-colors"
            >
              Kembali ke Beranda
            </button>
          </div>
        ) : paymentMethod === null ? (
          /* Payment Method Selection - QRIS Only */
          <>
          <div className="px-4 py-4">
            <div className="bg-[#2952CC] rounded-t-2xl p-5">
              <h2 className="text-white text-2xl font-bold">Payment Method</h2>
            </div>

            {/* Favorite in Indonesia Label */}
            <div className="bg-[#2952CC] px-5 py-3 flex items-center gap-2">
              <ThumbsUp className="w-5 h-5 text-white" fill="white" />
              <span className="text-white text-base font-semibold">Favorite in Indonesia</span>
            </div>

            {/* Payment Method Options - QRIS Only */}
            <div className="bg-[#2952CC] px-5 pb-5 rounded-b-2xl space-y-3">
              {/* QRIS */}
              <button
                onClick={() => handlePaymentMethodSelect('qris', 'QRIS')}
                disabled={isProcessing}
                className="w-full bg-white rounded-xl p-4 flex items-center justify-between transition-all hover:shadow-lg disabled:opacity-50"
              >
                <div className="flex items-center gap-2">
                  <span className="text-gray-900 font-semibold text-base">QRIS</span>
                </div>
                <div className="flex items-center gap-2">
                  <img src={qrisIconUrl} alt="QRIS" className="h-6" />
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              </button>
            </div>
          </div>

          {/* Syarat & Ketentuan - always open */}
          <div className="px-4 pb-4">
            <div className="border border-gray-700 rounded-xl overflow-hidden">
              <div className="p-4 bg-[#1a2332]">
                <span className="text-white text-base font-bold">Syarat & Ketentuan</span>
              </div>
              <div className="p-4 bg-[#1a2332]/50 space-y-4 text-white">
                {/* Banner Kupon */}
                <div className="mb-4">
                  <img
                    src={cardImageUrl}
                    alt={event.name}
                    className="w-full h-auto object-contain rounded-lg"
                  />
                </div>
                {/* Display terms from database */}
                {terms
                  .filter(term => term.isActive && term.description.trim() !== '')
                  .sort((a, b) => a.order - b.order)
                  .map((term) => (
                    <div key={term.id}>
                      <p className="text-sm text-gray-400 mb-1">{term.title}</p>
                      <p className="text-sm whitespace-pre-wrap">{term.description}</p>
                    </div>
                  ))
                }
              </div>
            </div>
          </div>
          </>
        ) : showBuyerForm ? (
          /* Buyer Data Form */
          <div className="px-4 py-4">
            <BuyerDataForm
              onSubmit={handleBuyerDataSubmit}
              onBack={handleBackFromBuyerForm}
              isProcessing={isProcessing}
              eventPrice={event.price}
            />
          </div>
        ) : null}

        <MobileBottomNav />
      </div>
    </div>
  );
}
