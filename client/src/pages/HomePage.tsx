import { useQuery } from "@tanstack/react-query";
import { MobileHeader } from "@/components/MobileHeader";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { Footer } from "@/components/Footer";
import { ChevronLeft, ChevronRight, Play, Pause } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import type { Event, Banner, Video, Partner, PaymentMethod } from "@shared/schema";
import { useVideo } from "@/contexts/VideoContext";
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
  const [currentHeroSlide, setCurrentHeroSlide] = useState(0);
  const { selectedVideo, setSelectedVideo, isPlaying, setIsPlaying, closeVideo, closeVideoAndGoHome } = useVideo();
  const videoRef = useRef<HTMLVideoElement>(null);

  // Handle browser back button when video is open
  useEffect(() => {
    if (selectedVideo) {
      // Push a new history state when video opens
      window.history.pushState({ videoOpen: true }, '');

      const handlePopState = (e: PopStateEvent) => {
        if (selectedVideo) {
          e.preventDefault();
          closeVideoAndGoHome();
        }
      };

      window.addEventListener('popstate', handlePopState);

      return () => {
        window.removeEventListener('popstate', handlePopState);
      };
    }
  }, [selectedVideo, closeVideoAndGoHome]);

  const handlePurchase = (event: Event) => {
    // Navigate directly to payment page
    window.location.href = `/payment/${event.id}`;
  };

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
      <div className="w-screen md:max-w-undifest mx-auto pb-20">
        <MobileHeader />

        {/* Hero Banner Carousel */}
        <div className="bg-[#16202a]">
          <div className="relative" data-testid="hero-banner-carousel">
            <div className="relative bg-gray-900 flex items-center justify-center">
              {bannersLoading ? (
                <div className="w-full h-48 bg-gray-800/50 animate-pulse" />
              ) : banners && banners.length > 0 ? (
                <img
                  src={banners[currentHeroSlide]?.imageUrl || banner01Url}
                  alt={banners[currentHeroSlide]?.title || `Hero Banner ${currentHeroSlide + 1}`}
                  className="w-full h-auto object-contain max-h-[400px]"
                />
              ) : (
                <img
                  src={banner01Url}
                  alt="Default Hero Banner"
                  className="w-full h-auto object-contain max-h-[400px]"
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
        <div className="px-2 md:px-4 py-6 bg-[#16202a]">
          <h2 className="text-xl font-bold text-white mb-4">Pilih & Beli Undian</h2>
          <div className="space-y-1">
            {eventsLoading ? (
              <>
                <div className="h-44 bg-gray-800/50 rounded-xl animate-pulse" />
                <div className="h-44 bg-gray-800/50 rounded-xl animate-pulse" />
              </>
            ) : activeEvents.length > 0 ? (
              activeEvents.map((event) => {
                const cardImageUrl = getEventCardImage(event);
                const isTemplateCard = event.cardTemplate === "burgerKing" || event.cardTemplate === "yamahaNmax";

                if (isTemplateCard) {
                  return (
                    <div key={event.id} data-testid={`event-card-${event.id}`} className="group relative">
                      <div className="bg-transparent rounded-2xl overflow-hidden transition-all">
                        <div className="relative">
                          <img
                            src={cardImageUrl}
                            alt={event.name}
                            className="w-full h-auto"
                          />
                          <button
                            onClick={() => handlePurchase(event)}
                            data-testid={`button-buy-${event.id}`}
                            className="absolute bottom-4 right-4"
                          >
                            {/* Buy button: smaller on mobile (h-6), original on desktop (h-8) */}
                            <img src={tombolBeliUrl} alt="Beli" className="h-6 md:h-8 mt-[13px] mb-[13px]" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                } else {
                  return (
                    <div key={event.id} data-testid={`event-card-${event.id}`} className="group relative">
                      <div className="bg-transparent rounded-2xl overflow-hidden transition-all">
                        <div className="relative">
                          <img
                            src={cardImageUrl}
                            alt={event.name}
                            className="w-full h-auto object-contain"
                            style={{ paddingBottom: '15px' }}
                          />
                          <div className="absolute bottom-4 right-4 z-20">
                            <button
                              onClick={() => handlePurchase(event)}
                              data-testid={`button-buy-${event.id}`}
                            >
                              {/* Buy button: smaller on mobile (h-6), original on desktop (h-8) */}
                              <img src={tombolBeliUrl} alt="Beli" className="h-6 md:h-8" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }
              })
            ) : (
              <div className="text-center text-gray-400 py-8">
                Belum ada undian aktif
              </div>
            )}
          </div>
        </div>

        {/* Undifest Video */}
        <div id="video-section" className="px-4 pt-2 pb-6 bg-[#16202a]">
          <h2 className="text-xl font-bold text-white mb-4">Undifest Video</h2>
          {/* Single row with 4 videos - 25% width each */}
          <div className="flex gap-3 overflow-x-auto pb-2">
            {/* Video 1 */}
            <div
              onClick={() => setSelectedVideo('/attached_assets/WhatsApp Video 2026-01-19 at 7.14.06 PM.mp4')}
              className="relative rounded-xl overflow-hidden cursor-pointer hover-elevate transition-all bg-black flex-shrink-0 w-24"
            >
              <video
                src="/attached_assets/WhatsApp Video 2026-01-19 at 7.14.06 PM.mp4"
                className="w-full h-40 object-cover"
                autoPlay
                loop
                muted
                playsInline
              />
            </div>

            {/* Video 2 */}
            <div
              onClick={() => setSelectedVideo('/attached_assets/WhatsApp Video 2026-01-19 at 7.14.26 PM.mp4')}
              className="relative rounded-xl overflow-hidden cursor-pointer hover-elevate transition-all bg-black flex-shrink-0 w-24"
            >
              <video
                src="/attached_assets/WhatsApp Video 2026-01-19 at 7.14.26 PM.mp4"
                className="w-full h-40 object-cover"
                autoPlay
                loop
                muted
                playsInline
              />
            </div>

            {/* Video 3 */}
            <div
              onClick={() => setSelectedVideo('/attached_assets/WhatsApp Video 2026-01-19 at 7.14.55 PM.mp4')}
              className="relative rounded-xl overflow-hidden cursor-pointer hover-elevate transition-all bg-black flex-shrink-0 w-24"
            >
              <video
                src="/attached_assets/WhatsApp Video 2026-01-19 at 7.14.55 PM.mp4"
                className="w-full h-40 object-cover"
                autoPlay
                loop
                muted
                playsInline
              />
            </div>

            {/* Video 4 */}
            <div
              onClick={() => setSelectedVideo('/attached_assets/WhatsApp Video 2026-01-19 at 7.16.29 PM.mp4')}
              className="relative rounded-xl overflow-hidden cursor-pointer hover-elevate transition-all bg-black flex-shrink-0 w-24"
            >
              <video
                src="/attached_assets/WhatsApp Video 2026-01-19 at 7.16.29 PM.mp4"
                className="w-full h-40 object-cover"
                autoPlay
                loop
                muted
                playsInline
              />
            </div>
          </div>
        </div>

        {/* Video Modal - Shopee Live style (no controls) */}
        {selectedVideo && (
          <div
            className="fixed inset-0 z-50 bg-black flex items-center justify-center"
            onClick={(e) => {
              // Close video when clicking outside video area
              if (e.target === e.currentTarget) {
                closeVideo();
              }
            }}
          >
            <div className="relative w-full max-w-undifest mx-auto">
              {/* Header dengan tombol back */}
              <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/60 to-transparent">
                <div className="flex items-center gap-3 p-4">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      closeVideo();
                    }}
                    className="text-white p-1.5 hover:bg-white/10 rounded-full transition-all"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <h3 className="text-white text-base font-semibold">Pengundian 10.13.25</h3>
                </div>
              </div>

              {/* Video Player - no controls, clean like Shopee Live */}
              <div className="relative">
                <video
                  ref={videoRef}
                  src={selectedVideo}
                  className="w-full h-screen object-contain bg-black"
                  autoPlay
                  playsInline
                  loop
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (videoRef.current) {
                      if (isPlaying) {
                        videoRef.current.pause();
                        setIsPlaying(false);
                      } else {
                        videoRef.current.play();
                        setIsPlaying(true);
                      }
                    }
                  }}
                />

                {/* Play button overlay - HIDDEN (never show) */}
              </div>
            </div>
          </div>
        )}

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
