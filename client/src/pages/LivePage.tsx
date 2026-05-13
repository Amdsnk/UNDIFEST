import { useQuery } from "@tanstack/react-query";
import { MobileHeader } from "@/components/MobileHeader";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { Footer } from "@/components/Footer";
import { Play, Video as VideoIcon } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import type { Video } from "@shared/schema";
import { useVideo } from "@/contexts/VideoContext";

export default function LivePage() {
  const [activeTab, setActiveTab] = useState<"live" | "video">("live");
  const { selectedVideo, setSelectedVideo, isPlaying, setIsPlaying, closeVideo, closeVideoAndGoHome } = useVideo();
  const videoRef = useRef<HTMLVideoElement>(null);

  // Handle browser back button when video is open
  useEffect(() => {
    if (selectedVideo) {
      // Push a new history state when video opens
      window.history.pushState({ videoOpen: true }, '');

      const handlePopState = () => {
        // When user presses browser back button, go to homepage
        closeVideoAndGoHome();
      };

      window.addEventListener('popstate', handlePopState);

      return () => {
        window.removeEventListener('popstate', handlePopState);
      };
    }
  }, [selectedVideo, closeVideoAndGoHome]);

  const { data: videos, isLoading } = useQuery<Video[]>({
    queryKey: ["/api/videos"],
  });

  const liveVideos = videos?.filter(v => v.isLive === true) || [];
  const recordedVideos = videos?.filter(v => v.isLive === false) || [];

  return (
    <div className="min-h-screen bg-[#ffffff]">
      <div className="max-w-undifest mx-auto pb-20">
        <MobileHeader />

        {/* Tabs */}
        <div className="px-4 pt-6 pb-2 bg-[#16202a]">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setActiveTab("live")}
              data-testid="tab-live"
              className={`py-4 rounded-xl font-bold text-lg transition-all ${
                activeTab === "live"
                  ? "bg-gradient-to-r from-[#FF1493] to-[#FF1493] text-white shadow-lg shadow-pink-500/30"
                  : "bg-gradient-to-r from-purple-900/40 to-purple-800/40 text-gray-400"
              }`}
            >
              Video
            </button>
            <button
              onClick={() => setActiveTab("video")}
              data-testid="tab-video"
              className={`py-4 rounded-xl font-bold text-lg transition-all ${
                activeTab === "video"
                  ? "bg-gradient-to-r from-[#FF1493] to-[#FF1493] text-white shadow-lg shadow-pink-500/30"
                  : "bg-gradient-to-r from-purple-900/40 to-purple-800/40 text-gray-400"
              }`}
            >
              Lainnya
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-4 pb-8 bg-[#16202a]">
          {activeTab === "live" ? (
            <div className="space-y-4">
              {isLoading ? (
                <div className="h-48 bg-gray-800 rounded-lg animate-pulse" />
              ) : liveVideos.length > 0 ? (
                liveVideos.map((video) => {
                  const videoSrc = video.videoFile || video.videoUrl || '';
                  return (
                    <div
                      key={video.id}
                      data-testid={`live-video-${video.id}`}
                      className="gradient-border-purple cursor-pointer"
                      onClick={() => setSelectedVideo({ url: videoSrc, title: video.title })}
                    >
                      <div className="bg-[#1a2332] rounded-lg overflow-hidden">
                        <div className="relative">
                          {video.thumbnailUrl ? (
                            <img
                              src={video.thumbnailUrl}
                              alt={video.title}
                              className="w-full h-64 object-cover"
                            />
                          ) : videoSrc ? (
                            <video
                              src={videoSrc}
                              className="w-full h-64 object-cover"
                              autoPlay
                              muted
                              loop
                              playsInline
                            />
                          ) : (
                            <div className="w-full h-64 bg-gray-800 flex items-center justify-center">
                              <Play className="w-16 h-16 text-white/40" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                            <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center">
                              <Play className="w-8 h-8 text-black ml-1" fill="currentColor" />
                            </div>
                          </div>
                        </div>
                        <div className="p-4">
                          <span className="text-xs text-gray-400">Video</span>
                          <h3 className="text-white font-semibold">{video.title}</h3>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="flex flex-col items-center pt-16 pb-24">
                  <div className="w-24 h-24 mb-3 relative">
                    {/* Custom Video Camera Icon - Exact Match */}
                    <svg viewBox="0 0 100 100" className="w-full h-full">
                      <defs>
                        {/* Dark Blue/Purple Gradient for rounded square */}
                        <linearGradient id="squareGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" style={{ stopColor: '#2D3B5F', stopOpacity: 1 }} />
                          <stop offset="100%" style={{ stopColor: '#1F2937', stopOpacity: 1 }} />
                        </linearGradient>

                        {/* Cyan/Green Gradient for camera triangle */}
                        <linearGradient id="cameraGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" style={{ stopColor: '#06B6D4', stopOpacity: 0.9 }} />
                          <stop offset="100%" style={{ stopColor: '#10B981', stopOpacity: 0.7 }} />
                        </linearGradient>

                        {/* Blue/Purple Gradient for play triangle */}
                        <linearGradient id="playGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" style={{ stopColor: '#6366F1', stopOpacity: 0.9 }} />
                          <stop offset="100%" style={{ stopColor: '#8B5CF6', stopOpacity: 0.8 }} />
                        </linearGradient>
                      </defs>

                      {/* Rounded Square Background with border */}
                      <rect x="15" y="25" width="50" height="50" rx="12"
                            fill="url(#squareGradient)"
                            stroke="#4F46E5" strokeWidth="2.5" opacity="1"/>

                      {/* Play Triangle inside square */}
                      <path d="M 35 42 L 35 58 L 50 50 Z"
                            fill="url(#playGradient)"/>

                      {/* Camera Triangle (right side) */}
                      <path d="M 65 42 L 85 32 L 85 68 L 65 58 Z"
                            fill="url(#cameraGradient)"/>
                    </svg>
                  </div>
                  <p className="text-gray-400 text-center text-sm font-light">
                    Belum ada siaran Live saat ini
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {isLoading ? (
                <>
                  <div className="h-32 bg-gray-800 rounded-lg animate-pulse" />
                  <div className="h-32 bg-gray-800 rounded-lg animate-pulse" />
                  <div className="h-32 bg-gray-800 rounded-lg animate-pulse" />
                  <div className="h-32 bg-gray-800 rounded-lg animate-pulse" />
                </>
              ) : recordedVideos.length > 0 ? (
                recordedVideos.map((video) => {
                  const videoSrc = video.videoFile || video.videoUrl || '';
                  return (
                    <div
                      key={video.id}
                      data-testid={`video-${video.id}`}
                      className="gradient-border-cyan cursor-pointer"
                      onClick={() => setSelectedVideo({ url: videoSrc, title: video.title })}
                    >
                      <div className="bg-[#1a2332] rounded-lg overflow-hidden">
                        <div className="relative">
                          {video.thumbnailUrl ? (
                            <img
                              src={video.thumbnailUrl}
                              alt={video.title}
                              className="w-full h-32 object-cover"
                            />
                          ) : videoSrc ? (
                            <video
                              src={videoSrc}
                              className="w-full h-32 object-cover"
                              autoPlay
                              muted
                              loop
                              playsInline
                            />
                          ) : (
                            <div className="w-full h-32 bg-gray-800 flex items-center justify-center">
                              <Play className="w-12 h-12 text-white/40" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                            <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
                              <Play className="w-6 h-6 text-black ml-1" fill="currentColor" />
                            </div>
                          </div>
                        </div>
                        <div className="p-3">
                          <span className="text-xs text-gray-400">Video</span>
                          <h3 className="text-white text-sm font-semibold line-clamp-2">
                            {video.title}
                          </h3>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="col-span-2 flex flex-col items-center justify-center py-24">
                  <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-purple-900/30 to-purple-800/30 border border-purple-700/50 flex items-center justify-center mb-6">
                    <Play className="w-16 h-16 text-purple-400/60" />
                  </div>
                  <p className="text-gray-400 text-center text-sm">
                    Belum ada video tersedia
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <Footer />
        <MobileBottomNav />
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
            <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/80 via-black/40 to-transparent pb-8">
              <div className="flex items-center gap-3 px-4 pt-12 pb-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    closeVideoAndGoHome();
                  }}
                  className="text-white p-1.5 hover:bg-white/10 rounded-full transition-all flex-shrink-0"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <h3 className="text-white text-base font-semibold truncate">{selectedVideo.title}</h3>
              </div>
            </div>

            {/* Video Player - no controls, clean like Shopee Live */}
            <div className="relative">
              <video
                ref={videoRef}
                src={selectedVideo.url}
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
    </div>
  );
}
