import { useQuery, useMutation } from "@tanstack/react-query";
import { MobileHeader } from "@/components/MobileHeader";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { Footer } from "@/components/Footer";
import { useRoute, useLocation } from "wouter";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { Event } from "@shared/schema";
import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function PaymentPage() {
  const [, params] = useRoute("/payment/:eventId");
  const eventId = params?.eventId;
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [showTermsDropdown, setShowTermsDropdown] = useState(false);

  const { data: event, isLoading } = useQuery<Event>({
    queryKey: ["/api/events", eventId],
    enabled: !!eventId,
  });

  const purchaseMutation = useMutation({
    mutationFn: async () => {
      if (!event) throw new Error("Event not found");

      const userToken = localStorage.getItem("user_token");
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      // Only add authorization if user is logged in
      if (userToken) {
        headers["Authorization"] = `Bearer ${userToken}`;
      }

      const response = await apiRequest("/api/transactions", {
        method: "POST",
        headers,
        body: JSON.stringify({
          eventId: event.id,
          amount: event.price,
          eventName: event.name,
        }),
      });
      return response;
    },
    onSuccess: (data: any) => {
      // Redirect to iPaymu payment page directly
      if (data.paymentUrl) {
        toast({
          title: "Mengarahkan ke Pembayaran",
          description: "Anda akan diarahkan ke halaman pembayaran...",
        });
        window.location.href = data.paymentUrl;
      } else if (data.paymentError) {
        toast({
          variant: "destructive",
          title: "Pembayaran Gagal",
          description: data.paymentError,
        });
      }
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Pembelian Gagal",
        description: error.message || "Terjadi kesalahan saat membeli tiket",
      });
    },
  });

  const handlePurchaseClick = () => {
    purchaseMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a1621]">
        <div className="max-w-undifest mx-auto">
          <MobileHeader />
          <div className="p-8 text-center text-white">Loading...</div>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-[#0a1621]">
        <div className="max-w-undifest mx-auto">
          <MobileHeader />
          <div className="p-8 text-center text-white">Event tidak ditemukan</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#16202a]">
      <div className="max-w-undifest mx-auto pb-20 bg-[#16202a]">
        {/* Header */}
        <div className="bg-[#D32F2F] p-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/")}
              className="text-white p-2 hover:bg-white/10 rounded-full transition-all"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-xl font-bold text-white">Halaman pembayaran</h1>
          </div>
        </div>

        <div className="px-4 py-6 space-y-4">
          {/* Left Panel - Product Info */}
          <div className="bg-[#212121] rounded-xl p-4">
            {/* Brand Logo */}
            <div className="flex items-center gap-2 mb-4">
              <div className="text-[#FFD700] text-2xl font-bold">Udfest</div>
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
            </div>

            {/* Product Image */}
            <img
              src={event.imageUrl}
              alt={event.name}
              className="w-full h-48 object-cover rounded-lg mb-4"
            />

            {/* Product Title */}
            <h2 className="text-lg font-bold text-white mb-2">{event.name}</h2>

            {/* Price */}
            <div className="flex items-center gap-2 mb-4">
              <div className="bg-[#E91E63] p-2 rounded-lg">
                <span className="text-white font-bold">Rp {event.price.toLocaleString()}</span>
              </div>
            </div>

            {/* Syarat & Ketentuan Dropdown */}
            <div className="border border-gray-600 rounded-lg overflow-hidden">
              <button
                onClick={() => setShowTermsDropdown(!showTermsDropdown)}
                className="w-full flex items-center justify-between p-3 bg-[#333333] hover:bg-[#444444] transition-colors"
              >
                <span className="text-sm text-gray-300">Syarat & Ketentuan</span>
                {showTermsDropdown ? (
                  <ChevronUp className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                )}
              </button>
              {showTermsDropdown && (
                <div className="p-3 bg-[#2a2a2a] space-y-3">
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Harga Tiket</p>
                    <p className="text-white text-xs">Beli e-book senilai Rp {event.price.toLocaleString()} untuk mendapatkan 1 tiket undian.</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Jaminan</p>
                    <p className="text-white text-xs">Jaminan uang kembali Rp {event.price.toLocaleString()}.</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Hadiah</p>
                    <p className="text-white text-xs">{event.prize}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Periode</p>
                    <p className="text-white text-xs">
                      {new Date(event.startDate).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })} -{" "}
                      {new Date(event.endDate).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Pengumuman Pemenang</p>
                    <p className="text-white text-xs">
                      {new Date(event.announcementDate).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}{" "}
                      pukul 19.00 WIB
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* How it works button */}
            <button className="w-full mt-4 bg-[#4CAF50] text-white py-3 rounded-lg font-bold flex items-center justify-between px-4">
              <span>How it works</span>
              <span className="text-xl">×</span>
            </button>
          </div>

          {/* Right Panel - Payment Method */}
          <div className="bg-[#FFFFFF] rounded-xl overflow-hidden">
            {/* Payment Header */}
            <div className="bg-[#1976D2] p-4">
              <h3 className="text-lg font-bold text-white">Payment Method</h3>
              <p className="text-sm text-gray-200">Favorite in Indonesia</p>
            </div>

            {/* Payment Options */}
            <div className="p-4 space-y-3">
              {/* Virtual Account */}
              <div className="bg-[#F5F5F5] rounded-lg p-4 flex items-center justify-between cursor-pointer hover:bg-[#EEEEEE] transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                    <span className="text-blue-600 font-bold text-xs">VA</span>
                  </div>
                  <span className="text-gray-800 font-semibold">Virtual Account (VA)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-5 bg-blue-600 rounded"></div>
                  <div className="w-8 h-5 bg-red-600 rounded"></div>
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>

              {/* QRIS */}
              <div className="bg-[#F5F5F5] rounded-lg p-4 flex items-center justify-between cursor-pointer hover:bg-[#EEEEEE] transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                    <span className="text-purple-600 font-bold text-xs">QR</span>
                  </div>
                  <span className="text-gray-800 font-semibold">QRIS</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-5 bg-purple-600 rounded"></div>
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>

              {/* e-Wallet */}
              <div className="bg-[#F5F5F5] rounded-lg p-4 flex items-center justify-between cursor-pointer hover:bg-[#EEEEEE] transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                    <span className="text-green-600 font-bold text-xs">E-W</span>
                  </div>
                  <span className="text-gray-800 font-semibold">e-Wallet</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-5 bg-green-600 rounded"></div>
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>

              {/* Direct Debit */}
              <div className="bg-[#F5F5F5] rounded-lg p-4 flex items-center justify-between cursor-pointer hover:bg-[#EEEEEE] transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                    <span className="text-yellow-600 font-bold text-xs">DD</span>
                  </div>
                  <span className="text-gray-800 font-semibold">Direct Debit</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-5 bg-yellow-600 rounded"></div>
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Show it works button */}
            <button className="w-full mx-4 mb-4 bg-[#4CAF50] text-white py-3 rounded-lg font-bold flex items-center justify-between px-4">
              <span>Show it works</span>
              <span className="text-xl">×</span>
            </button>
          </div>
        </div>

        {/* Footer note */}
        <div className="px-4 py-4">
          <p className="text-gray-400 text-xs text-center">
            Judul paling atas. Tidak ada gambar kupon lagi. S&K di dropdown dan dalamnya memuat hadiah, periode, pengumuman. Embed ipaymu pembayaran.
          </p>
        </div>

        <MobileBottomNav />
      </div>
    </div>
  );
}
