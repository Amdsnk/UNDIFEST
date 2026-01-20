import { useQuery, useMutation } from "@tanstack/react-query";
import { MobileHeader } from "@/components/MobileHeader";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { Footer } from "@/components/Footer";
import { useRoute, useLocation } from "wouter";
import { FaFacebook, FaXTwitter, FaInstagram, FaYoutube, FaTiktok, FaTelegram } from "react-icons/fa6";
import { Ticket } from "lucide-react";
import type { Event } from "@shared/schema";
import { useState } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import bankUrl from "@assets/bank_new.png";

export default function EventDetailPage() {
  const [, params] = useRoute("/event/:id");
  const eventId = params?.id;
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false);

  const { data: event, isLoading } = useQuery<Event>({
    queryKey: ["/api/events", eventId],
    enabled: !!eventId,
  });

  const purchaseMutation = useMutation({
    mutationFn: async () => {
      if (!event) throw new Error("Event not found");

      const userToken = localStorage.getItem("user_token");
      if (!userToken) throw new Error("Please login first");

      const response = await apiRequest("/api/transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${userToken}`
        },
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
      setShowPurchaseDialog(false);

      // If payment URL is available, redirect to payment page
      if (data.paymentUrl) {
        toast({
          title: "Mengarahkan ke Pembayaran",
          description: "Anda akan diarahkan ke halaman pembayaran...",
        });
        // Redirect to iPaymu payment page
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
    const userToken = localStorage.getItem("user_token");
    if (!userToken) {
      toast({
        title: "Login Required",
        description: "Silakan login terlebih dahulu untuk membeli tiket",
      });
      navigate("/account");
      return;
    }
    setShowPurchaseDialog(true);
  };

  const handleConfirmPurchase = () => {
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

          <div>
            <h2 className="text-lg font-bold mb-2">Syarat & Ketentuan</h2>
            <p className="text-gray-300 text-sm">
              Beli e-book senilai Rp {event.price.toLocaleString()} untuk mendapatkan 1 tiket undian.
            </p>
          </div>

          <div>
            <p className="text-gray-300 text-sm">
              Jaminan uang kembali Rp {event.price.toLocaleString()}.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-bold mb-2">Hadiah :</h2>
            <p className="text-gray-300 text-sm">{event.prize}</p>
          </div>

          <div>
            <h2 className="text-lg font-bold mb-2">Periode :</h2>
            <p className="text-gray-300 text-sm">
              {new Date(event.startDate).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })} -{" "}
              {new Date(event.endDate).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>

          <div>
            <h2 className="text-lg font-bold mb-2">Pengumuman Pemenang:</h2>
            <p className="text-gray-300 text-sm">
              {new Date(event.announcementDate).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}{" "}
              pukul 19.00 WIB melalui seluruh channel resmi kami.
            </p>
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

          {/* Purchase Confirmation Dialog */}
          <Dialog open={showPurchaseDialog} onOpenChange={setShowPurchaseDialog}>
            <DialogContent className="bg-[#16202a] text-white border-[#8B2FC9]">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold">Konfirmasi Pembelian</DialogTitle>
                <DialogDescription className="text-gray-400">
                  Pastikan detail pembelian Anda sudah benar
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <p className="text-sm text-gray-400">Event</p>
                  <p className="text-lg font-bold">{event?.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Harga</p>
                  <p className="text-2xl font-bold text-[#00D4FF]">Rp {event?.price.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Hadiah</p>
                  <p className="text-base">{event?.prize}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowPurchaseDialog(false)}
                  disabled={purchaseMutation.isPending}
                  data-testid="button-cancel-purchase"
                  className="flex-1 h-12 rounded-lg border-2 border-[#8B2FC9] text-[#8B2FC9] font-bold hover:bg-[#8B2FC9]/10"
                >
                  Batal
                </button>
                <button
                  onClick={handleConfirmPurchase}
                  disabled={purchaseMutation.isPending}
                  data-testid="button-confirm-purchase"
                  className="flex-1 h-12 rounded-lg holographic-btn font-bold"
                >
                  {purchaseMutation.isPending ? "Memproses..." : "Konfirmasi"}
                </button>
              </div>
            </DialogContent>
          </Dialog>

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
