import { useQuery } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { MobileHeader } from "@/components/MobileHeader";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import type { Event } from "@shared/schema";

export default function TebakUndianPage() {
  const [, params] = useRoute("/tebak-undian/:eventId");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const eventId = params?.eventId;

  const undianType = new URLSearchParams(window.location.search).get("undian"); // "A" | "B"
  const [amount, setAmount] = useState<string>("");

  const { data: event, isLoading } = useQuery<Event>({
    queryKey: ["/api/events", eventId],
    enabled: !!eventId,
  });

  const ev = event as any;
  const label = undianType === "A"
    ? (ev?.undianALabel || "Undian A")
    : (ev?.undianBLabel || "Undian B");
  // Prefer payment-specific image; fallback to front card image
  const image = undianType === "A"
    ? (ev?.undianAPaymentImage || ev?.undianAImage)
    : (ev?.undianBPaymentImage || ev?.undianBImage);
  const minPrice = event?.price ?? 0;

  const handleLanjutkan = () => {
    const val = parseInt(amount || "0");
    if (!event) return;

    if (event.allowCustomAmount) {
      if (val < minPrice) {
        toast({
          variant: "destructive",
          title: "Nominal Kurang",
          description: `Minimal Rp ${minPrice.toLocaleString("id-ID")}`,
        });
        return;
      }
      navigate(`/payment/${eventId}?undian=${undianType}&amount=${val}`);
    } else {
      navigate(`/payment/${eventId}?undian=${undianType}`);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#16202a]">
        <div className="max-w-undifest mx-auto min-h-screen">
          <MobileHeader />
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-500" />
          </div>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-[#16202a]">
        <div className="max-w-undifest mx-auto min-h-screen">
          <MobileHeader />
          <div className="flex items-center justify-center h-64">
            <p className="text-white">Event tidak ditemukan.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#ffffff]">
      <div className="max-w-undifest mx-auto min-h-screen bg-[#16202a]">
        <MobileHeader />

        <div className="px-4 pt-4 pb-8 space-y-6">
          {/* Heading */}
          <h1 className="text-white text-xl font-bold">Tebak Undian</h1>

          {/* Undian Card */}
          <div className="flex justify-center">
            <div className="relative w-56">
              {/* Card container */}
              <div className="rounded-2xl overflow-hidden shadow-2xl border border-white/10">
                {/* Image area */}
                <div className="relative bg-gradient-to-br from-orange-100 to-orange-200 aspect-[3/3.2]">
                  {image ? (
                    <img
                      src={image}
                      alt={label}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    /* Placeholder if no image uploaded */
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-200 to-pink-200">
                      <span className="text-6xl">🎁</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Nominal Input */}
          <div className="bg-[#1a2332] rounded-2xl p-5 space-y-4">
            <h3 className="text-white text-lg font-bold">Masukkan Nominal Undian</h3>
            <p className="text-gray-400 text-sm">
              Minimal Rp {minPrice.toLocaleString("id-ID")}
            </p>

            {event.allowCustomAmount ? (
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 font-semibold">
                  Rp
                </span>
                <input
                  type="number"
                  min={minPrice}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder={minPrice.toString()}
                  className="w-full pl-12 pr-4 py-3 bg-[#0d1520] border border-gray-600 rounded-xl text-white text-lg font-semibold focus:outline-none focus:border-purple-500"
                />
              </div>
            ) : (
              /* Fixed price — show read-only */
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 font-semibold">
                  Rp
                </span>
                <input
                  type="text"
                  readOnly
                  value={minPrice.toLocaleString("id-ID")}
                  className="w-full pl-12 pr-4 py-3 bg-[#0d1520] border border-gray-700 rounded-xl text-white text-lg font-semibold opacity-70 cursor-not-allowed"
                />
              </div>
            )}

            <button
              onClick={handleLanjutkan}
              className="w-full py-3 rounded-xl font-bold text-white text-base"
              style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)" }}
            >
              Lanjutkan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
