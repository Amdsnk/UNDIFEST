import { useQuery } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { MobileHeader } from "@/components/MobileHeader";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import type { Event } from "@shared/schema";
import { useState } from "react";
import { ChevronDown, ChevronUp, Copy, Check, ThumbsUp, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import undian01Url from "@assets/undian01_1763489504866.png";
import undian02Url from "@assets/undian02_1763489504867.png";

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

export default function PaymentPage() {
  const [, params] = useRoute("/payment/:eventId");
  const eventId = params?.eventId;
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [showTermsDropdown, setShowTermsDropdown] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'va' | 'qris' | 'cstore' | 'cod'>('va');
  const [paymentChannel, setPaymentChannel] = useState<string>('bca');
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails | null>(null);
  const [copied, setCopied] = useState(false);

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

  const handlePayment = async () => {
    if (!event || isProcessing) return;

    setIsProcessing(true);

    const userToken = localStorage.getItem("user_token");
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (userToken) {
      headers["Authorization"] = `Bearer ${userToken}`;
    }

    try {
      const response = await fetch("/api/transactions/direct", {
        method: "POST",
        headers,
        body: JSON.stringify({
          eventId: event.id,
          amount: event.price,
          eventName: event.name,
          paymentMethod,
          paymentChannel,
        }),
      });

      const data = await response.json();

      if (data.paymentNo) {
        // Payment successful - show payment details
        setPaymentDetails({
          paymentNo: data.paymentNo,
          paymentName: data.paymentName,
          total: data.total,
          fee: data.fee,
          expired: data.expired,
          qrImage: data.qrImage,
          via: data.via,
          channel: data.channel,
        });
        toast({
          title: "Pembayaran Dibuat",
          description: "Silakan selesaikan pembayaran Anda.",
        });
        setIsProcessing(false);
      } else if (data.paymentError) {
        toast({
          variant: "destructive",
          title: "Pembayaran Gagal",
          description: data.paymentError,
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

  // Payment method options
  const paymentMethods = [
    { value: 'va', label: 'Virtual Account' },
    { value: 'qris', label: 'QRIS' },
    { value: 'cstore', label: 'Convenience Store' },
    { value: 'cod', label: 'Cash on Delivery' },
  ];

  // Payment channel options based on selected method
  const getChannelOptions = () => {
    switch (paymentMethod) {
      case 'va':
        return [
          { value: 'bca', label: 'BCA' },
          { value: 'mandiri', label: 'Mandiri' },
          { value: 'bni', label: 'BNI' },
          { value: 'bri', label: 'BRI' },
          { value: 'bsi', label: 'BSI' },
          { value: 'permata', label: 'Permata' },
          { value: 'danamon', label: 'Danamon' },
          { value: 'cimb', label: 'CIMB Niaga' },
          { value: 'bmi', label: 'Bank Muamalat' },
          { value: 'bag', label: 'Bank Artha Graha' },
        ];
      case 'qris':
        return [{ value: 'qris', label: 'QRIS' }];
      case 'cstore':
        return [
          { value: 'indomaret', label: 'Indomaret' },
          { value: 'alfamart', label: 'Alfamart' },
        ];
      case 'cod':
        return [{ value: 'rpx', label: 'RPX' }];
      default:
        return [];
    }
  };

  return (
    <div className="min-h-screen bg-[#ffffff]">
      <div className="max-w-undifest mx-auto pb-20 bg-[#16202a]">
        <MobileHeader />

        {/* Halaman Pembayaran (1) - Judul paling atas */}
        <div className="px-4 pt-4 pb-2">
          <h1 className="text-white text-xl font-bold">
            {paymentDetails ? "Detail Pembayaran" : "Halaman pembayaran (1)"}
          </h1>
        </div>

        {/* Event Image Card */}
        <div className="px-4 py-4">
          <div className="bg-transparent rounded-2xl overflow-hidden">
            <img
              src={cardImageUrl}
              alt={event.name}
              className="w-full h-auto"
            />
          </div>
        </div>

        {/* Event Title */}
        <div className="px-4 py-2">
          <h2 className="text-white text-lg font-bold">{event.name}</h2>
        </div>

        {/* Syarat & Ketentuan Dropdown */}
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

        {/* Periode Section */}
        <div className="px-4 py-2">
          <div className="text-white">
            <p className="text-sm text-gray-400 mb-1">Periode :</p>
            <p className="text-sm">
              Beli e-book senilai Rp {event.price.toLocaleString()} untuk mendapatkan 1 tiket undian dengan jaminan uang kembali Rp {event.price.toLocaleString()}.
            </p>
          </div>
        </div>

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
        ) : (
          /* Payment Method Selection - New Design */
          <>
            {/* Payment Method Header */}
            <div className="px-4 py-4">
              <div className="bg-[#4169E1] rounded-t-2xl p-4">
                <h2 className="text-white text-xl font-bold text-center">Payment Method</h2>
              </div>

              {/* Favorite in Indonesia Label */}
              <div className="bg-[#3454C5] px-4 py-3 flex items-center gap-2">
                <ThumbsUp className="w-5 h-5 text-white" fill="white" />
                <span className="text-white text-sm font-semibold">Favorite in Indonesia</span>
              </div>

              {/* Payment Method Options */}
              <div className="bg-[#3454C5] px-4 pb-4 rounded-b-2xl space-y-3">
                {/* Virtual Account (VA) */}
                <button
                  onClick={() => {
                    setPaymentMethod('va');
                    setPaymentChannel('bca');
                  }}
                  className={`w-full bg-white rounded-xl p-4 flex items-center justify-between transition-all hover:shadow-lg ${
                    paymentMethod === 'va' ? 'ring-2 ring-[#00D4FF]' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-[#4169E1] rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">VA</span>
                    </div>
                    <span className="text-gray-800 font-semibold">Virtual Account (VA)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <div className="w-8 h-5 bg-blue-600 rounded"></div>
                      <div className="w-8 h-5 bg-blue-800 rounded"></div>
                      <div className="w-8 h-5 bg-red-600 rounded"></div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                </button>

                {/* QRIS */}
                <button
                  onClick={() => {
                    setPaymentMethod('qris');
                    setPaymentChannel('qris');
                  }}
                  className={`w-full bg-white rounded-xl p-4 flex items-center justify-between transition-all hover:shadow-lg ${
                    paymentMethod === 'qris' ? 'ring-2 ring-[#00D4FF]' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">QR</span>
                    </div>
                    <span className="text-gray-800 font-semibold">QRIS</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-red-600">QRIS</span>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                </button>

                {/* e-Wallet */}
                <button
                  onClick={() => {
                    setPaymentMethod('cstore');
                    setPaymentChannel('indomaret');
                  }}
                  className={`w-full bg-white rounded-xl p-4 flex items-center justify-between transition-all hover:shadow-lg ${
                    paymentMethod === 'cstore' ? 'ring-2 ring-[#00D4FF]' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">CS</span>
                    </div>
                    <span className="text-gray-800 font-semibold">Convenience Store</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-orange-600">Pay</span>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                </button>

                {/* Direct Debit */}
                <button
                  onClick={() => {
                    setPaymentMethod('cod');
                    setPaymentChannel('rpx');
                  }}
                  className={`w-full bg-white rounded-xl p-4 flex items-center justify-between transition-all hover:shadow-lg ${
                    paymentMethod === 'cod' ? 'ring-2 ring-[#00D4FF]' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">COD</span>
                    </div>
                    <span className="text-gray-800 font-semibold">Cash on Delivery</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <div className="w-8 h-5 bg-red-600 rounded"></div>
                      <div className="w-8 h-5 bg-orange-500 rounded"></div>
                      <div className="w-8 h-5 bg-blue-700 rounded"></div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                </button>
              </div>
            </div>

            {/* Bank/Channel Selection (shown when VA is selected) */}
            {paymentMethod === 'va' && (
              <div className="px-4 py-2">
                <p className="text-white text-sm font-bold mb-3">Pilih Bank</p>
                <div className="grid grid-cols-2 gap-3">
                  {getChannelOptions().map((channel) => (
                    <button
                      key={channel.value}
                      onClick={() => setPaymentChannel(channel.value)}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        paymentChannel === channel.value
                          ? 'border-[#00D4FF] bg-[#00D4FF]/20 text-white'
                          : 'border-gray-700 bg-[#1a2332] text-gray-400 hover:border-gray-600'
                      }`}
                    >
                      <span className="text-sm font-bold">{channel.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Convenience Store Selection */}
            {paymentMethod === 'cstore' && (
              <div className="px-4 py-2">
                <p className="text-white text-sm font-bold mb-3">Pilih Toko</p>
                <div className="grid grid-cols-2 gap-3">
                  {getChannelOptions().map((channel) => (
                    <button
                      key={channel.value}
                      onClick={() => setPaymentChannel(channel.value)}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        paymentChannel === channel.value
                          ? 'border-[#00D4FF] bg-[#00D4FF]/20 text-white'
                          : 'border-gray-700 bg-[#1a2332] text-gray-400 hover:border-gray-600'
                      }`}
                    >
                      <span className="text-sm font-bold">{channel.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Bayar & Konfir Button */}
            <div className="px-4 py-6">
              <button
                onClick={handlePayment}
                disabled={isProcessing}
                className="holographic-btn w-full h-14 rounded-lg text-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? "Memproses..." : "Bayar & Konfir"}
              </button>
            </div>
          </>
        )}

        <MobileBottomNav />
      </div>
    </div>
  );
}
