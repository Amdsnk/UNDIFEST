import { useQuery } from "@tanstack/react-query";
import { MobileHeader } from "@/components/MobileHeader";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { Footer } from "@/components/Footer";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";
import type { Event, Banner, Video, Partner, PaymentMethod } from "@shared/schema";
import { Link } from "wouter";
import logoUrl from "@assets/logo undifest_1763476451738.png";
import banner01Url from "@assets/banner01_1763489481905.jpg";
import undian01Url from "@assets/undian01_1763489504866.png";
import undian02Url from "@assets/undian02_1763489504867.png";
import bankUrl from "@assets/bank_1763489481904.png";
import tombolBeliUrl from "@assets/tombol_beli_1763581173753.png";
import kemensosLogoUrl from "@assets/logo kemensos_1763490013360.png";
import thumbTestimoniUrl from "@assets/thumb-testimoni_1763489504865.png";
import thumbVideoUrl from "@assets/thumb-video_1763489504866.png";
import iconFbUrl from "@assets/icon_fb_1763489481907.png";
import iconIgUrl from "@assets/icon_ig_1763489481907.png";
import iconXUrl from "@assets/icon_x_1763489481912.png";
import iconYoutubeUrl from "@assets/icon_youtube_1763489481912.png";
import iconTiktokUrl from "@assets/icon_tiktok_1763489481910.png";
import iconTelegramUrl from "@assets/icon_telegram_1763489481908.png";
import iconAlamatUrl from "@assets/icon_alamat_1763489481906.png";
import iconTeleponUrl from "@assets/icon_telepon_1763489481909.png";
import iconWAUrl from "@assets/icon_WA_1763489481911.png";

export default function HomePage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [currentHeroSlide, setCurrentHeroSlide] = useState(0);

  const { data: banners, isLoading: bannersLoading } = useQuery<Banner[]>({
    queryKey: ["/api/banners"],
  });

  const { data: events, isLoading: eventsLoading } = useQuery<Event[]>({
    queryKey: ["/api/events"],
  });

  const { data: videos, isLoading: videosLoading } = useQuery<Video[]>({
    queryKey: ["/api/videos"],
  });

  const { data: partners, isLoading: partnersLoading } = useQuery<Partner[]>({
    queryKey: ["/api/partners"],
  });

  const { data: paymentMethods, isLoading: paymentMethodsLoading } = useQuery<PaymentMethod[]>({
    queryKey: ["/api/payment-methods"],
  });

  // Helper to get safe banner count (minimum 1 to prevent NaN in modulo)
  const getBannerCount = () => {
    return banners && banners.length > 0 ? banners.length : 1;
  };

  // Reset slide index when banners length changes
  useEffect(() => {
    if (banners && banners.length > 0) {
      setCurrentSlide(prev => prev >= banners.length ? 0 : prev);
    } else {
      setCurrentSlide(0);
    }
  }, [banners]);

  // Auto-rotate banners
  useEffect(() => {
    const bannerCount = getBannerCount();
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % bannerCount);
    }, 5000);
    return () => clearInterval(interval);
  }, [banners]);

  const nextSlide = () => {
    const bannerCount = getBannerCount();
    if (bannerCount <= 0) return;
    setCurrentSlide((prev) => (prev + 1) % bannerCount);
  };

  const prevSlide = () => {
    const bannerCount = getBannerCount();
    if (bannerCount <= 0) return;
    setCurrentSlide((prev) => (prev - 1 + bannerCount) % bannerCount);
  };

  // Hero banner carousel controls
  const nextHeroSlide = () => {
    const bannerCount = getBannerCount();
    if (bannerCount <= 0) return;
    setCurrentHeroSlide((prev) => (prev + 1) % bannerCount);
  };

  const prevHeroSlide = () => {
    const bannerCount = getBannerCount();
    if (bannerCount <= 0) return;
    setCurrentHeroSlide((prev) => (prev - 1 + bannerCount) % bannerCount);
  };

  // Auto-rotate hero banners
  useEffect(() => {
    const bannerCount = getBannerCount();
    const interval = setInterval(() => {
      setCurrentHeroSlide((prev) => (prev + 1) % bannerCount);
    }, 5000);
    return () => clearInterval(interval);
  }, [banners]);

  // Filter and sort events: Burger King first, then Yamaha NMAX, then others
  const activeEvents = (events?.filter(e => e.status === "aktif") || []).sort((a, b) => {
    if (a.cardTemplate === "burgerKing") return -1;
    if (b.cardTemplate === "burgerKing") return 1;
    if (a.cardTemplate === "yamahaNmax") return -1;
    if (b.cardTemplate === "yamahaNmax") return 1;
    return 0;
  });
  
  // Helper to get event card image based on cardTemplate or fallback to imageUrl
  const getEventCardImage = (event: Event) => {
    if (event.cardTemplate === "burgerKing") {
      return undian01Url;
    } else if (event.cardTemplate === "yamahaNmax") {
      return undian02Url;
    }
    return event.imageUrl; // Fallback to dynamic imageUrl
  };



  return (
    <div className="min-h-screen bg-[#ffffff]">
      <div className="max-w-undifest mx-auto pb-20">
        <MobileHeader />

        {/* Banner Carousel */}
        <div className="relative overflow-hidden" data-testid="banner-carousel">
          <div className="relative">
            {bannersLoading ? (
              <div className="h-56 bg-gray-800/50 animate-pulse" />
            ) : banners && banners.length > 0 ? (
              <img
                src={banners[currentSlide]?.imageUrl || banner01Url}
                alt={banners[currentSlide]?.title || `Banner ${currentSlide + 1}`}
                className="w-full h-auto"
              />
            ) : (
              <img
                src={banner01Url}
                alt="Default Banner"
                className="w-full h-auto"
              />
            )}
          </div>
          {!bannersLoading && (
            <>
              <button
                onClick={prevSlide}
                data-testid="button-prev-slide"
                className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white p-2 rounded-full transition-all backdrop-blur-sm"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={nextSlide}
                data-testid="button-next-slide"
                className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white p-2 rounded-full transition-all backdrop-blur-sm"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}
        </div>

        {/* Hero Banner Carousel - Added above Events Section */}
        <div className="bg-[#16202a] px-4 pt-6">
          <div className="relative overflow-hidden rounded-2xl" data-testid="hero-banner-carousel">
            <div className="relative">
              {bannersLoading ? (
                <div className="h-48 bg-gray-800/50 animate-pulse rounded-2xl" />
              ) : banners && banners.length > 0 ? (
                <img
                  src={banners[currentHeroSlide]?.imageUrl || banner01Url}
                  alt={banners[currentHeroSlide]?.title || `Hero Banner ${currentHeroSlide + 1}`}
                  className="w-full h-auto rounded-2xl"
                />
              ) : (
                <img
                  src={banner01Url}
                  alt="Default Hero Banner"
                  className="w-full h-auto rounded-2xl"
                />
              )}
            </div>
            {!bannersLoading && banners && banners.length > 1 && (
              <>
                <button
                  onClick={prevHeroSlide}
                  data-testid="button-prev-hero-slide"
                  className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white p-2 rounded-full transition-all backdrop-blur-sm"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={nextHeroSlide}
                  data-testid="button-next-hero-slide"
                  className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white p-2 rounded-full transition-all backdrop-blur-sm"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Events Section - Dynamic rendering with cardTemplate support */}
        <div className="px-4 py-6 bg-[#16202a]">
          <h2 className="text-xl font-bold text-white mb-4">Pilih & Beli Undian</h2>
          <div className="space-y-4">
            {eventsLoading ? (
              <>
                <div className="h-44 bg-gray-800/50 rounded-xl animate-pulse" />
                <div className="h-44 bg-gray-800/50 rounded-xl animate-pulse" />
              </>
            ) : activeEvents.length > 0 ? (
              activeEvents.map((event) => {
                const cardImageUrl = getEventCardImage(event);
                const isTemplateCard = event.cardTemplate === "burgerKing" || event.cardTemplate === "yamahaNmax";

                return (
                  <Link key={event.id} href={`/event/${event.id}`}>
                    <div
                      data-testid={`event-card-${event.id}`}
                      className="cursor-pointer group relative"
                    >
                      <div className="bg-transparent rounded-2xl overflow-hidden hover-elevate transition-all">
                        {isTemplateCard ? (
                          // Template card: display complete template image with button overlay
                          (<div className="relative">
                            <img
                              src={cardImageUrl}
                              alt={event.name}
                              className="w-full h-auto pb-5"
                            />
                            <button 
                              data-testid={`button-buy-${event.id}`}
                              className="absolute bottom-4 right-4"
                            >
                              <img src={tombolBeliUrl} alt="Beli" className="h-10 mt-[13px] mb-[13px]" />
                            </button>
                          </div>)
                        ) : (
                          // Dynamic event: render with full image only
                          (<div className="relative min-h-[180px] overflow-hidden">
                            <img
                              src={cardImageUrl}
                              alt={event.name}
                              className="w-full h-full min-h-[180px] object-cover pb-[15px]"
                            />
                            <div className="absolute bottom-4 right-4 z-20">
                              <button 
                                data-testid={`button-buy-${event.id}`}
                              >
                                <img src={tombolBeliUrl} alt="Beli" className="h-10 mt-[0px] mb-[0px]" />
                              </button>
                            </div>
                          </div>)
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })
            ) : (
              <div className="text-center text-gray-400 py-8">
                Belum ada undian aktif
              </div>
            )}
          </div>
        </div>

        {/* Rekomendasi Video */}
        <div className="px-4 py-6 bg-[#16202a]">
          <h2 className="text-xl font-bold text-white mb-4">Rekomendasi Video</h2>
          <div className="grid grid-cols-2 gap-3">
            {/* Live Card */}
            <Link href="/live">
              <div 
                data-testid="card-live"
                className="bg-gradient-to-r from-[#4DD0E1] to-[#26A69A] rounded-2xl p-5 cursor-pointer hover-elevate transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex flex-col gap-1">
                    <span className="text-white font-bold text-[21px]">Live</span>
                    <span className="text-white/90 text-[18px] font-normal">Lihat</span>
                  </div>
                  <div className="flex gap-2">
                    <img
                      src={thumbVideoUrl}
                      alt="Live 2"
                      className="w-28 h-28 rounded-xl object-contain"
                    />
                  </div>
                </div>
              </div>
            </Link>

            {/* Testimoni Card */}
            <Link href="/live">
              <div 
                data-testid="card-testimoni"
                className="bg-gradient-to-r from-[#7C9EF8] to-[#F48FB1] rounded-2xl p-5 cursor-pointer hover-elevate transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex flex-col gap-1">
                    <span className="text-white font-bold text-[21px]">Testimoni</span>
                    <span className="text-white/90 text-[18px] font-normal">Lihat</span>
                  </div>
                  <div className="flex gap-2">
                    <img
                      src={thumbTestimoniUrl}
                      alt="Testimoni 2"
                      className="w-28 h-28 rounded-xl object-contain"
                    />
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* Metode Pembayaran */}
        <div className="px-4 py-6 bg-[#16202a]">
          <h2 className="text-xl font-bold text-white mb-4">Metode Pembayaran</h2>
          <div className="space-y-4">
            {paymentMethodsLoading ? (
              <div className="h-32 bg-gray-800/50 rounded-xl animate-pulse" />
            ) : paymentMethods && paymentMethods.length > 0 ? (
              <div className="grid grid-cols-3 gap-3">
                {paymentMethods
                  .filter(method => method.isActive)
                  .map((method) => (
                    <div
                      key={method.id}
                      className="bg-white rounded-xl p-3 flex items-center justify-center"
                      data-testid={`payment-method-${method.id}`}
                    >
                      {method.logoUrl ? (
                        <img
                          src={method.logoUrl}
                          alt={method.name}
                          className="max-w-full max-h-12 object-contain"
                        />
                      ) : (
                        <span className="text-gray-800 text-xs font-semibold text-center">{method.name}</span>
                      )}
                    </div>
                  ))}
              </div>
            ) : (
              <img
                src={bankUrl}
                alt="Payment Methods"
                className="w-full h-auto"
                data-testid="payment-methods-fallback"
              />
            )}
          </div>
        </div>

        <Footer />
      </div>
      <MobileBottomNav />


    </div>
  );
}
