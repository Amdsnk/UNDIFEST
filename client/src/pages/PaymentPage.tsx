import { useQuery } from "@tanstack/react-query";
import { MobileHeader } from "@/components/MobileHeader";
import { useRoute, useLocation } from "wouter";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { Event } from "@shared/schema";
import { useState, useEffect } from "react";

export default function PaymentPage() {
  const [, params] = useRoute("/payment/:eventId");
  const eventId = params?.eventId;
  const [, navigate] = useLocation();
  const [showTermsDropdown, setShowTermsDropdown] = useState(false);
  const [ipaymuUrl, setIpaymuUrl] = useState<string | null>(null);

  const { data: event, isLoading } = useQuery<Event>({
    queryKey: ["/api/events", eventId],
    enabled: !!eventId,
  });

  // Auto-create transaction and get iPaymu URL on mount
  useEffect(() => {
    const createTransaction = async () => {
      if (!event) return;

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
          setIpaymuUrl(data.paymentUrl);
          // Auto redirect to iPaymu
          window.location.href = data.paymentUrl;
        } else if (data.paymentError) {
          console.error("Payment error:", data.paymentError);
        }
      } catch (error) {
        console.error("Transaction creation error:", error);
      }
    };

    createTransaction();
  }, [event]);

  if (isLoading || !event) {
    return (
      <div className="min-h-screen bg-[#16202a]">
        <div className="max-w-undifest mx-auto">
          <MobileHeader />
          <div className="p-8 text-center text-white">
            {isLoading ? "Loading..." : "Event tidak ditemukan"}
          </div>
        </div>
      </div>
    );
  }

  // Show loading while redirecting to iPaymu
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

        <div className="px-4 py-6">
          {/* Product Info */}
          <div className="bg-[#212121] rounded-xl p-4 mb-4">
            <h2 className="text-lg font-bold text-white mb-2">{event.name}</h2>
            <div className="flex items-center gap-2">
              <span className="text-[#FFD700] font-bold text-xl">Rp {event.price.toLocaleString()}</span>
            </div>
          </div>

          {/* Syarat & Ketentuan Dropdown */}
          <div className="bg-[#212121] rounded-xl overflow-hidden mb-4">
            <button
              onClick={() => setShowTermsDropdown(!showTermsDropdown)}
              className="w-full flex items-center justify-between p-4 text-white"
            >
              <span className="text-sm">Syarat & Ketentuan</span>
              {showTermsDropdown ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
            {showTermsDropdown && (
              <div className="p-4 border-t border-gray-600 space-y-2">
                <p className="text-xs text-gray-300">Harga: Rp {event.price.toLocaleString()}</p>
                <p className="text-xs text-gray-300">Hadiah: {event.prize}</p>
                <p className="text-xs text-gray-300">
                  Periode: {new Date(event.startDate).toLocaleDateString("id-ID")} - {new Date(event.endDate).toLocaleDateString("id-ID")}
                </p>
              </div>
            )}
          </div>

          {/* Loading message while preparing payment */}
          <div className="text-center py-8">
            {ipaymuUrl ? (
              <p className="text-white">Mengarahkan ke pembayaran...</p>
            ) : (
              <>
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00D4FF] mx-auto mb-4"></div>
                <p className="text-white">Menyiapkan pembayaran...</p>
                <p className="text-gray-400 text-sm mt-2">Mohon tunggu sebentar</p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
