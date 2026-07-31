import { useQuery } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { MobileHeader } from "@/components/MobileHeader";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import type { Event, TermsCondition } from "@shared/schema";

const PLATFORM_MIN = 10_000;

export default function TebakUndianPage() {
  const [, params] = useRoute("/tebak-undian/:eventId");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const eventId = params?.eventId;

  const undianType = new URLSearchParams(window.location.search).get("undian"); // "A" | "B"
  const [rawAmount, setRawAmount] = useState<string>("");
  const [displayAmount, setDisplayAmount] = useState<string>("");

  const { data: event, isLoading } = useQuery<Event>({
    queryKey: ["/api/events", eventId],
    enabled: !!eventId,
  });

  const { data: terms = [] } = useQuery<TermsCondition[]>({
    queryKey: [`/api/events/${eventId}/terms`],
    enabled: !!eventId,
  });

  const ev = event as any;
  const label = undianType === "A"
    ? (ev?.undianALabel || "Undian A")
    : (ev?.undianBLabel || "Undian B");
  const image = undianType === "A"
    ? (ev?.undianAPaymentImage || ev?.undianAImage)
    : (ev?.undianBPaymentImage || ev?.undianBImage);
  const eventMin = event?.price ?? 0;
  const minPrice = Math.max(eventMin, PLATFORM_MIN);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\./g, "").replace(/[^0-9]/g, "");
    setRawAmount(raw);
    if (raw) {
      setDisplayAmount(parseInt(raw, 10).toLocaleString("id-ID"));
    } else {
      setDisplayAmount("");
    }
  };

  const handleLanjutkan = () => {
    const val = parseInt(rawAmount || "0", 10);
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
          <div className="space-y-1">
            <h1 className="text-white text-xl font-bold">Tebak Undian</h1>
            <p className="text-white font-bold">
              Menang ditransfer <span style={{ color: "#fff000" }}>2X LIPAT!</span>
            </p>
          </div>

          {/* Undian Card — slightly smaller so S&K fits below */}
          <div className="flex justify-center">
            <div className="relative w-40">
              <div className="aspect-[3/3.2]">
                {image ? (
                  <img
                    src={image}
                    alt={label}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-6xl">🎁</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Nominal Input */}
          <div className="bg-[#1a2332] rounded-2xl p-5 space-y-4">
            <h3 className="text-white text-lg font-bold">Masukkan Nominal Undian</h3>
            {event.allowCustomAmount ? (
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 font-semibold">
                  Rp
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  min={minPrice}
                  value={displayAmount}
                  onChange={handleAmountChange}
                  placeholder=""
                  className="w-full pl-12 pr-4 py-3 bg-[#0d1520] border border-gray-600 rounded-xl text-white text-lg font-semibold focus:outline-none focus:border-purple-500"
                />
              </div>
            ) : (
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

          {/* Syarat & Ketentuan */}
          <div className="bg-[#1a2332] rounded-2xl p-5 space-y-4 border border-gray-600">
            <h3 className="text-white text-lg font-bold">Syarat &amp; Ketentuan</h3>

            {terms.length > 0 ? (
              // Dynamic terms from database (editable via admin panel)
              [...terms].sort((a, b) => a.order - b.order).map((term) => (
                <div key={term.id} className="space-y-1">
                  <p className="text-gray-400 text-sm">{term.title}</p>
                  <p className="text-white text-sm whitespace-pre-line">{term.description}</p>
                </div>
              ))
            ) : (
              // Default fallback content
              <>
                <div className="space-y-1">
                  <p className="text-gray-400 text-sm">Hadiah</p>
                  <p className="text-white text-sm">Sesuai nominal partisipasi yang dipilih.</p>
                  <p className="text-white text-sm mt-1">Contoh:</p>
                  <p className="text-white text-sm">• Beli Rp 100.000 → Hadiah Rp 100.000</p>
                  <p className="text-white text-sm">• Beli Rp 1.000.000 → Hadiah Rp 1.000.000</p>
                </div>

                <div className="space-y-1">
                  <p className="text-gray-400 text-sm">Harga</p>
                  <p className="text-white text-sm">Minimal Rp 10.000</p>
                </div>

                <div className="space-y-1">
                  <p className="text-gray-400 text-sm">Refund</p>
                  <p className="text-white text-sm">Tidak</p>
                </div>

                <div className="space-y-1">
                  <p className="text-gray-400 text-sm">Pengumuman Pemenang</p>
                  <p className="text-white text-sm">Setiap hari pukul 16.00 WIB.</p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
