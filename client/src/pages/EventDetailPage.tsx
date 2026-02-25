import { useQuery, useMutation } from "@tantml:react-query";
import { MobileHeader } from "@/components/MobileHeader";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { Footer } from "@/components/Footer";
import { useRoute, useLocation } from "wouter";
import { FaFacebook, FaXTwitter, FaInstagram, FaYoutube, FaTiktok, FaTelegram } from "react-icons/fa6";
import { Ticket, ChevronDown, ChevronUp } from "lucide-react";
import type { Event, TermsCondition } from "@shared/schema";
import { useState } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import bankUrl from "@assets/bank_new.png";

export default function EventDetailPage() {
  const [, params] = useRoute("/event/:id");
  const eventId = params?.id;
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [showTermsDropdown, setShowTermsDropdown] = useState(false);

  const { data: event, isLoading } = useQuery<Event>({
    queryKey: ["/api/events", eventId],
    enabled: !!eventId,
  });

  // Fetch terms & conditions for this event
  const { data: terms = [] } = useQuery<TermsCondition[]>({
    queryKey: [`/api/events/${eventId}/terms`],
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
      queryClient.invalidateQueries({ queryKey: ["/api/user/transactions"] });

      // If payment URL is available, redirect to payment page
      if (data.paymentUrl) {
        toast({
          title: "Mengarahkan ke Pembayaran",
          description: "Anda akan diarahkan ke halaman pembayaran...",
        });
        // Redirect to iPaymu payment page directly
        window.location.href = data.paymentUrl;
      } else if (data.paymentError) {
        // Payment gateway error but transaction created
        toast({
          variant: "destructive",
          title: "Pembayaran Gagal",
          description: data.paymentError,
        });
        navigate("/history");
      } else {
        // No payment gateway configured - direct purchase
        toast({
          title: "Pembelian Berhasil!",
          description: "Tiket Anda telah berhasil dibeli. Lihat riwayat transaksi untuk detailnya.",
        });
        navigate("/history");
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
    // Navigate to payment page instead of direct purchase
    if (!event) return;
    window.location.href = `/payment/${event.id}`;
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
    <div className="min-h-screen bg-[#ffffff]">
      <div className="max-w-undifest mx-auto pb-20 bg-[#16202a]">
        <MobileHeader />

        {/* Event Image */}
        <div className="gradient-border-red m-4">
          <div className="bg-[#1a2332] rounded-lg overflow-hidden p-4">
            <img
              src={event.imageUrl}
              alt={event.name}
              className="w-full h-48 object-cover rounded-lg mb-4"
            />
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-[#8B2FC9] to-[#FF1493] rounded-lg flex items-center justify-center">
                <Ticket className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <div className="text-[#00D4FF] text-2xl font-bold">Rp {event.price.toLocaleString()}</div>
                <div className="text-gray-400 text-sm">Info</div>
              </div>
            </div>
          </div>
        </div>

        {/* Event Details */}
        <div className="px-4 py-6 space-y-6 text-white">
          <div>
            <h1 className="text-2xl font-bold mb-2">{event.name}</h1>
          </div>

          {/* Syarat & Ketentuan Dropdown */}
          <div className="border border-gray-700 rounded-xl overflow-hidden">
            <button
              onClick={() => setShowTermsDropdown(!showTermsDropdown)}
              className="w-full flex items-center justify-between p-4 bg-[#1a2332] hover:bg-[#1a2332]/80 transition-colors"
            >
              <span className="text-lg font-bold">Syarat & Ketentuan</span>
              {showTermsDropdown ? (
                <ChevronUp className="w-5 h-5 text-[#00D4FF]" />
              ) : (
                <ChevronDown className="w-5 h-5 text-[#00D4FF]" />
              )}
            </button>
            {showTermsDropdown && (
              <div className="p-4 bg-[#1a2332]/50 space-y-4">
                {terms.length > 0 ? (
                  // Display custom terms from database
                  terms.map((term) => (
                    <div key={term.id}>
                      <p className="text-sm text-gray-400 mb-1">{term.title}</p>
                      <p className="text-white whitespace-pre-wrap">{term.description}</p>
                    </div>
                  ))
                ) : (
                  // Fallback to default terms if no custom terms
                  <>
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Harga Tiket</p>
                      <p className="text-white">Beli e-book senilai Rp {event.price.toLocaleString()} untuk mendapatkan 1 tiket undian.</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Jaminan</p>
                      <p className="text-white">Jaminan uang kembali Rp {event.price.toLocaleString()}.</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Hadiah</p>
                      <p className="text-white">{event.prize}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Periode</p>
                      <p className="text-white">
                        {new Date(event.startDate).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })} -{" "}
                        {new Date(event.endDate).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Pengumuman Pemenang</p>
                      <p className="text-white">
                        {new Date(event.announcementDate).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}{" "}
                        pukul 19.00 WIB melalui seluruh channel resmi kami.
                      </p>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          <div>
            <p className="text-gray-300 text-sm">
              Untuk pembaruan dan informasi resmi, silakan follow akun media sosial kami di bawah.
            </p>
          </div>

          {/* Social Media */}
          <div className="flex gap-4 justify-center py-4">
            <a href="#" className="w-12 h-12 rounded-full bg-gradient-to-br from-[#8B2FC9] to-[#FF1493] flex items-center justify-center hover:scale-110 transition-transform" data-testid="social-facebook">
              <FaFacebook className="w-6 h-6 text-white" />
            </a>
            <a href="#" className="w-12 h-12 rounded-full bg-gradient-to-br from-[#8B2FC9] to-[#FF1493] flex items-center justify-center hover:scale-110 transition-transform" data-testid="social-twitter">
              <FaXTwitter className="w-6 h-6 text-white" />
            </a>
            <a href="#" className="w-12 h-12 rounded-full bg-gradient-to-br from-[#8B2FC9] to-[#FF1493] flex items-center justify-center hover:scale-110 transition-transform" data-testid="social-instagram">
              <FaInstagram className="w-6 h-6 text-white" />
            </a>
            <a href="#" className="w-12 h-12 rounded-full bg-gradient-to-br from-[#8B2FC9] to-[#FF1493] flex items-center justify-center hover:scale-110 transition-transform" data-testid="social-youtube">
              <FaYoutube className="w-6 h-6 text-white" />
            </a>
            <a href="#" className="w-12 h-12 rounded-full bg-gradient-to-br from-[#8B2FC9] to-[#FF1493] flex items-center justify-center hover:scale-110 transition-transform" data-testid="social-tiktok">
              <FaTiktok className="w-6 h-6 text-white" />
            </a>
            <a href="#" className="w-12 h-12 rounded-full bg-gradient-to-br from-[#8B2FC9] to-[#FF1493] flex items-center justify-center hover:scale-110 transition-transform" data-testid="social-telegram">
              <FaTelegram className="w-6 h-6 text-white" />
            </a>
          </div>

          {/* Purchase Button */}
          <button
            onClick={handlePurchaseClick}
            data-testid="button-purchase"
            className="holographic-btn w-full h-14 rounded-lg text-xl font-bold mt-6"
          >
            Beli Tiket (Rp {event.price.toLocaleString()})
          </button>

          {/* Payment Methods */}
          <div className="pt-6">
            <h2 className="text-lg font-bold mb-4">Metode Pembayaran</h2>
            <div className="space-y-4">
              <img
                src={bankUrl}
                alt="Payment Methods"
                className="w-full h-auto"
              />
            </div>
          </div>
        </div>

        <Footer />
        <MobileBottomNav />
      </div>
    </div>
  );
}
