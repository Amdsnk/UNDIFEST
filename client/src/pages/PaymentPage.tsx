import { useQuery } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { MobileHeader } from "@/components/MobileHeader";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import type { Event } from "@shared/schema";
import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import undian01Url from "@assets/undian01_1763489504866.png";
import undian02Url from "@assets/undian02_1763489504867.png";

export default function PaymentPage() {
  const [, params] = useRoute("/payment/:eventId");
  const eventId = params?.eventId;
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [showTermsDropdown, setShowTermsDropdown] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

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
      const response = await fetch("/api/transactions", {
        method: "POST",
        headers,
        body: JSON.stringify({
          eventId: event.id,
          amount: event.price,
          eventName: event.name,
        }),
      });

      const data = await response.json();

      if (data.paymentUrl) {
        toast({
          title: "Mengarahkan ke Pembayaran",
          description: "Anda akan diarahkan ke halaman pembayaran iPaymu...",
        });
        // Redirect to iPaymu payment page
        window.location.href = data.paymentUrl;
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

        {/* Halaman Pembayaran (1) - Judul paling atas */}
        <div className="px-4 pt-4 pb-2">
          <h1 className="text-white text-xl font-bold">Halaman pembayaran (1)</h1>
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

        <MobileBottomNav />
      </div>
    </div>
  );
}
