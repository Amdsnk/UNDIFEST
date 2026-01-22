import { useQuery } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { MobileHeader } from "@/components/MobileHeader";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import BuyerDataForm from "@/components/BuyerDataForm";
import type { Event } from "@shared/schema";
import { useState } from "react";
import { ChevronDown, ChevronUp, Copy, Check, ThumbsUp, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import undian01Url from "@assets/undian01_1763489504866.png";
import undian02Url from "@assets/undian02_1763489504867.png";
import qrisIconUrl from "@assets/qris_default.png";
import bankIconUrl from "@assets/bank.png";
import cstoreIconUrl from "@assets/cstore.png";
import debitIconUrl from "@assets/debitonline.png";

interface PaymentDetails {
  paymentNo: string;
  paymentName: string;
  total: number;
  fee: number;
  expired: string;
  qrImage?: string;
  via: string;
  channel: string;
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
  const [showTermsDropdown, setShowTermsDropdown] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'va' | 'qris' | 'directdebit' | 'cstore' | null>(null);
  const [paymentChannel, setPaymentChannel] = useState<string>('');
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails | null>(null);
  const [copied, setCopied] = useState(false);
  const [showBuyerForm, setShowBuyerForm] = useState(false);
  const [buyerData, setBuyerData] = useState<BuyerData | null>(null);

  const { data: event, isLoading: eventLoading } = useQuery<Event>({
    queryKey: ["/api/events", eventId],
    enabled: !!eventId,
  });

  // Helper to get event card image based on cardTemplate or fallback to imageUrl
  const getEventCardImage = (event: Event) => {
    if (event.cardTemplate === "burgerKing") {
      return undian01Url;
    } else if (event.cardTemplate === "yamahaNmax") {
      return undian02Url;
    }
    return event.imageUrl;
  };

  const handlePaymentMethodSelect = (method: 'va' | 'qris' | 'directdebit' | 'cstore', channel: string) => {
    if (!event || isProcessing) return;

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
      console.log("Creating payment with:", {
        eventId: event.id,
        amount: event.price,
        eventName: event.name,
        paymentMethod,
        paymentChannel,
        buyerName: data.name,
        buyerPhone: data.phone,
        buyerEmail: data.email,
      });

      const response = await fetch("/api/transactions/direct", {
        method: "POST",
        headers,
        body: JSON.stringify({
          eventId: event.id,
          amount: event.price,
          eventName: event.name,
          paymentMethod,
          paymentChannel,
          buyerName: data.name,
          buyerPhone: data.phone,
          buyerEmail: data.email,
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

      if (responseData.paymentNo) {
        // Payment successful - show payment details
        setPaymentDetails({
          paymentNo: responseData.paymentNo,
          paymentName: responseData.paymentName,
          total: responseData.total,
          fee: responseData.fee,
          expired: responseData.expired,
          qrImage: responseData.qrImage,
          via: responseData.via,
          channel: responseData.channel,
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
      <div className="max-w-undifest mx-auto pb-20 bg-[#16202a]">
        <MobileHeader />

        {/* Event Title - Only show if not in payment details view */}
        {!paymentDetails && (
          <div className="px-4 pt-4 pb-2">
            <h2 className="text-white text-lg font-bold">{event.name}</h2>
          </div>
        )}

        {/* Syarat & Ketentuan Dropdown - Only show if not in payment details view */}
        {!paymentDetails && (
          <div className="px-4 py-2">
            <div className="border border-gray-700 rounded-xl overflow-hidden">
              <button
                onClick={() => setShowTermsDropdown(!showTermsDropdown)}
                className="w-full flex items-center justify-between p-4 bg-[#1a2332] hover:bg-[#1a2332]/80 transition-colors"
              >
                <span className="text-white text-base font-bold">Syarat & Ketentuan</span>
                {showTermsDropdown ? (
                  <ChevronUp className="w-5 h-5 text-[#00D4FF]" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-[#00D4FF]" />
                )}
              </button>
              {showTermsDropdown && (
                <div className="p-4 bg-[#1a2332]/50 space-y-4 text-white">
                  {/* Banner Kupon */}
                  <div className="mb-4">
                    <img
                      src={cardImageUrl}
                      alt={event.name}
                      className="w-full h-auto object-contain rounded-lg"
                    />
                  </div>

                  <div>
                    <p className="text-sm text-gray-400 mb-1">Harga Tiket</p>
                    <p className="text-sm">Beli e-book senilai Rp {event.price.toLocaleString()} untuk mendapatkan 1 tiket undian.</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Jaminan</p>
                    <p className="text-sm">Jaminan uang kembali Rp {event.price.toLocaleString()}.</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Hadiah</p>
                    <p className="text-sm">{event.prize}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Periode</p>
                    <p className="text-sm">
                      {new Date(event.startDate).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })} -{" "}
                      {new Date(event.endDate).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Pengumuman Pemenang</p>
                    <p className="text-sm">
                      {new Date(event.announcementDate).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}{" "}
                      pukul 19.00 WIB melalui seluruh channel resmi kami.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Payment Details or Payment Method Selection */}
        {paymentDetails ? (
          /* Payment Details Display */
          <div className="px-4 py-4 space-y-4">
            {/* QR Code for QRIS */}
            {paymentDetails.qrImage && (
              <div className="bg-white p-4 rounded-xl">
                <img src={paymentDetails.qrImage} alt="QR Code" className="w-full max-w-xs mx-auto" />
              </div>
            )}

            {/* Payment Number */}
            <div className="bg-[#1a2332] p-4 rounded-xl">
              <p className="text-gray-400 text-sm mb-2">Nomor Pembayaran</p>
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

            {/* Payment Info */}
            <div className="bg-[#1a2332] p-4 rounded-xl space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400 text-sm">Bank/Metode</span>
                <span className="text-white text-sm font-bold">{paymentDetails.paymentName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400 text-sm">Total</span>
                <span className="text-white text-sm font-bold">Rp {paymentDetails.total.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400 text-sm">Biaya Admin</span>
                <span className="text-white text-sm">Rp {paymentDetails.fee.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400 text-sm">Berlaku Hingga</span>
                <span className="text-white text-sm">{new Date(paymentDetails.expired).toLocaleString("id-ID")}</span>
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-[#1a2332] p-4 rounded-xl">
              <p className="text-gray-400 text-sm mb-2">Instruksi Pembayaran</p>
              <ol className="text-white text-sm space-y-1 list-decimal list-inside">
                <li>Salin nomor pembayaran di atas</li>
                <li>Buka aplikasi mobile banking atau ATM</li>
                <li>Pilih menu transfer ke {paymentDetails.paymentName}</li>
                <li>Masukkan nomor pembayaran</li>
                <li>Konfirmasi pembayaran</li>
              </ol>
            </div>

            {/* Back Button */}
            <button
              onClick={() => navigate("/")}
              className="w-full bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-lg font-bold transition-colors"
            >
              Kembali ke Beranda
            </button>
          </div>
        ) : paymentMethod === null ? (
          /* Payment Method Selection - New Design matching screenshot */
          <div className="px-4 py-4">
            <div className="bg-[#2952CC] rounded-t-2xl p-5">
              <h2 className="text-white text-2xl font-bold">Payment Method</h2>
            </div>

            {/* Favorite in Indonesia Label */}
            <div className="bg-[#2952CC] px-5 py-3 flex items-center gap-2">
              <ThumbsUp className="w-5 h-5 text-white" fill="white" />
              <span className="text-white text-base font-semibold">Favorite in Indonesia</span>
            </div>

            {/* Payment Method Options */}
            <div className="bg-[#2952CC] px-5 pb-5 rounded-b-2xl space-y-3">
              {/* Virtual Account (VA) */}
              <button
                onClick={() => setPaymentMethod('va')}
                disabled={isProcessing}
                className="w-full bg-white rounded-xl p-4 flex items-center justify-between transition-all hover:shadow-lg disabled:opacity-50"
              >
                <span className="text-gray-900 font-semibold text-base">Virtual Account (VA)</span>
                <div className="flex items-center gap-2">
                  <img src={bankIconUrl} alt="Bank" className="h-6" />
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              </button>

              {/* QRIS */}
              <button
                onClick={() => handlePaymentMethodSelect('qris', 'qris')}
                disabled={isProcessing}
                className="w-full bg-white rounded-xl p-4 flex items-center justify-between transition-all hover:shadow-lg disabled:opacity-50"
              >
                <span className="text-gray-900 font-semibold text-base">QRIS</span>
                <div className="flex items-center gap-2">
                  <img src={qrisIconUrl} alt="QRIS" className="h-6" />
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              </button>

              {/* Direct Debit */}
              <button
                onClick={() => setPaymentMethod('directdebit')}
                disabled={isProcessing}
                className="w-full bg-white rounded-xl p-4 flex items-center justify-between transition-all hover:shadow-lg disabled:opacity-50"
              >
                <div className="flex items-center gap-2">
                  <span className="text-gray-900 font-semibold text-base">Direct Debit</span>
                  <span className="bg-green-100 text-green-700 text-xs font-semibold px-2 py-1 rounded">Recommendation</span>
                </div>
                <div className="flex items-center gap-2">
                  <img src={debitIconUrl} alt="Direct Debit" className="h-6" />
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              </button>

              {/* Convenience Store */}
              <button
                onClick={() => setPaymentMethod('cstore')}
                disabled={isProcessing}
                className="w-full bg-white rounded-xl p-4 flex items-center justify-between transition-all hover:shadow-lg disabled:opacity-50"
              >
                <span className="text-gray-900 font-semibold text-base">Convenience Store</span>
                <div className="flex items-center gap-2">
                  <img src={cstoreIconUrl} alt="Convenience Store" className="h-6" />
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              </button>
            </div>
          </div>
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
        ) : (
          /* Bank/Channel Selection */
          <div className="px-4 py-4">
            {/* Virtual Account Bank Selection */}
            {paymentMethod === 'va' && (
              <div className="bg-white rounded-2xl p-6 space-y-4">
                <h3 className="text-gray-800 text-lg font-bold text-center mb-4">Pilih Bank Virtual Account</h3>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => handlePaymentMethodSelect('va', 'bag')}
                    disabled={isProcessing}
                    className="p-4 border-2 border-gray-300 rounded-lg hover:border-[#4169E1] transition-all disabled:opacity-50"
                  >
                    <span className="text-sm font-semibold text-gray-700">BAG</span>
                  </button>
                  <button
                    onClick={() => handlePaymentMethodSelect('va', 'bca')}
                    disabled={isProcessing}
                    className="p-4 border-2 border-gray-300 rounded-lg hover:border-[#4169E1] transition-all disabled:opacity-50"
                  >
                    <span className="text-sm font-semibold text-gray-700">BCA</span>
                  </button>
                  <button
                    onClick={() => handlePaymentMethodSelect('va', 'bni')}
                    disabled={isProcessing}
                    className="p-4 border-2 border-gray-300 rounded-lg hover:border-[#4169E1] transition-all disabled:opacity-50"
                  >
                    <span className="text-sm font-semibold text-gray-700">BNI</span>
                  </button>
                  <button
                    onClick={() => handlePaymentMethodSelect('va', 'bri')}
                    disabled={isProcessing}
                    className="p-4 border-2 border-gray-300 rounded-lg hover:border-[#4169E1] transition-all disabled:opacity-50"
                  >
                    <span className="text-sm font-semibold text-gray-700">BRI</span>
                  </button>
                  <button
                    onClick={() => handlePaymentMethodSelect('va', 'bsi')}
                    disabled={isProcessing}
                    className="p-4 border-2 border-gray-300 rounded-lg hover:border-[#4169E1] transition-all disabled:opacity-50"
                  >
                    <span className="text-sm font-semibold text-gray-700">BSI</span>
                  </button>
                  <button
                    onClick={() => handlePaymentMethodSelect('va', 'cimb')}
                    disabled={isProcessing}
                    className="p-4 border-2 border-gray-300 rounded-lg hover:border-[#4169E1] transition-all disabled:opacity-50"
                  >
                    <span className="text-sm font-semibold text-gray-700">CIMB</span>
                  </button>
                  <button
                    onClick={() => handlePaymentMethodSelect('va', 'danamon')}
                    disabled={isProcessing}
                    className="p-4 border-2 border-gray-300 rounded-lg hover:border-[#4169E1] transition-all disabled:opacity-50"
                  >
                    <span className="text-sm font-semibold text-gray-700">Danamon</span>
                  </button>
                  <button
                    onClick={() => handlePaymentMethodSelect('va', 'mandiri')}
                    disabled={isProcessing}
                    className="p-4 border-2 border-gray-300 rounded-lg hover:border-[#4169E1] transition-all disabled:opacity-50"
                  >
                    <span className="text-sm font-semibold text-gray-700">Mandiri</span>
                  </button>
                  <button
                    onClick={() => handlePaymentMethodSelect('va', 'bmi')}
                    disabled={isProcessing}
                    className="p-4 border-2 border-gray-300 rounded-lg hover:border-[#4169E1] transition-all disabled:opacity-50"
                  >
                    <span className="text-sm font-semibold text-gray-700">Muamalat</span>
                  </button>
                  <button
                    onClick={() => handlePaymentMethodSelect('va', 'permata')}
                    disabled={isProcessing}
                    className="p-4 border-2 border-gray-300 rounded-lg hover:border-[#4169E1] transition-all disabled:opacity-50"
                  >
                    <span className="text-sm font-semibold text-gray-700">Permata</span>
                  </button>
                </div>
                <button
                  onClick={() => setPaymentMethod(null)}
                  className="w-full mt-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-semibold transition-colors"
                >
                  Kembali
                </button>
              </div>
            )}

            {/* Direct Debit Bank Selection */}
            {paymentMethod === 'directdebit' && (
              <div className="bg-white rounded-2xl p-6 space-y-4">
                <h3 className="text-gray-800 text-lg font-bold text-center mb-4">Pilih Bank Direct Debit</h3>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => handlePaymentMethodSelect('directdebit', 'bca')}
                    disabled={isProcessing}
                    className="p-4 border-2 border-gray-300 rounded-lg hover:border-[#4169E1] transition-all disabled:opacity-50"
                  >
                    <span className="text-sm font-semibold text-gray-700">BCA</span>
                  </button>
                  <button
                    onClick={() => handlePaymentMethodSelect('directdebit', 'mandiri')}
                    disabled={isProcessing}
                    className="p-4 border-2 border-gray-300 rounded-lg hover:border-[#4169E1] transition-all disabled:opacity-50"
                  >
                    <span className="text-sm font-semibold text-gray-700">Mandiri</span>
                  </button>
                  <button
                    onClick={() => handlePaymentMethodSelect('directdebit', 'bni')}
                    disabled={isProcessing}
                    className="p-4 border-2 border-gray-300 rounded-lg hover:border-[#4169E1] transition-all disabled:opacity-50"
                  >
                    <span className="text-sm font-semibold text-gray-700">BNI</span>
                  </button>
                </div>
                <button
                  onClick={() => setPaymentMethod(null)}
                  className="w-full mt-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-semibold transition-colors"
                >
                  Kembali
                </button>
              </div>
            )}

            {/* Convenience Store Selection */}
            {paymentMethod === 'cstore' && (
              <div className="bg-white rounded-2xl p-6 space-y-4">
                <h3 className="text-gray-800 text-lg font-bold text-center mb-4">Pilih Convenience Store</h3>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handlePaymentMethodSelect('cstore', 'indomaret')}
                    disabled={isProcessing}
                    className="p-4 border-2 border-gray-300 rounded-lg hover:border-[#4169E1] transition-all disabled:opacity-50"
                  >
                    <span className="text-sm font-semibold text-gray-700">Indomaret</span>
                  </button>
                  <button
                    onClick={() => handlePaymentMethodSelect('cstore', 'alfamart')}
                    disabled={isProcessing}
                    className="p-4 border-2 border-gray-300 rounded-lg hover:border-[#4169E1] transition-all disabled:opacity-50"
                  >
                    <span className="text-sm font-semibold text-gray-700">Alfamart</span>
                  </button>
                </div>
                <button
                  onClick={() => setPaymentMethod(null)}
                  className="w-full mt-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-semibold transition-colors"
                >
                  Kembali
                </button>
              </div>
            )}
          </div>
        )}

        <MobileBottomNav />
      </div>
    </div>
  );
}
