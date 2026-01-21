import { useQuery } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import type { Event } from "@shared/schema";
import { useState, useEffect } from "react";
import bankUrl from "@assets/bank_new.png";

export default function PaymentPage() {
  const [, params] = useRoute("/payment/:eventId");
  const eventId = params?.eventId;
  const [, navigate] = useLocation();
  const [ipaymuUrl, setIpaymuUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { data: event, isLoading: eventLoading } = useQuery<Event>({
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
          setLoading(false);
        } else {
          setError("Gagal membuat pembayaran. Silakan coba lagi.");
          setLoading(false);
        }
      } catch (err: any) {
        console.error("Transaction creation error:", err);
        setError(err.message || "Terjadi kesalahan. Silakan coba lagi.");
        setLoading(false);
      }
    };

    createTransaction();
  }, [event]);

  // Auto redirect to iPaymu when URL is ready
  useEffect(() => {
    if (ipaymuUrl) {
      window.location.href = ipaymuUrl;
    }
  }, [ipaymuUrl]);

  if (eventLoading || loading) {
    return (
      <div className="min-h-screen bg-[#16202a]">
        <div className="max-w-undifest mx-auto">
          <div className="p-8 text-center text-white">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[#00D4FF] mx-auto mb-4"></div>
            <p>Memproses pembayaran...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-[#16202a]">
        <div className="max-w-undifest mx-auto">
          <div className="p-8 text-center text-white">
            <p className="text-red-400 mb-4">{error || "Event tidak ditemukan"}</p>
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

  // If we have iPaymu URL, show loading while redirecting
  if (ipaymuUrl) {
    return (
      <div className="min-h-screen bg-[#16202a]">
        <div className="max-w-undifest mx-auto">
          <div className="p-8 text-center text-white">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[#00D4FF] mx-auto mb-4"></div>
            <p className="text-xl font-bold mb-2">Mengarahkan ke pembayaran...</p>
            <p className="text-gray-400 text-sm">Mohon tunggu sebentar</p>
            <p className="text-gray-500 text-xs mt-4">Jika tidak terarah otomatis, <a href={ipaymuUrl} className="text-[#00D4FF] underline">klik di sini</a></p>
          </div>
        </div>
      </div>
    );
  }

  return null; // This should not be reached
}
