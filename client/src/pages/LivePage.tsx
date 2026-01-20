import { useQuery } from "@tanstack/react-query";
import { MobileHeader } from "@/components/MobileHeader";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { Footer } from "@/components/Footer";
import { Play, Video as VideoIcon } from "lucide-react";
import { useState } from "react";
import type { Video } from "@shared/schema";

export default function LivePage() {
  const [activeTab, setActiveTab] = useState<"live" | "video">("live");

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
              Live
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
              Video
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-4 bg-[#16202a]">
          {activeTab === "live" ? (
            <div className="space-y-4">
              {isLoading ? (
                <div className="h-48 bg-gray-800 rounded-lg animate-pulse" />
              ) : liveVideos.length > 0 ? (
                liveVideos.map((video) => (
                  <div key={video.id} data-testid={`live-video-${video.id}`} className="gradient-border-purple">
                    <div className="bg-[#1a2332] rounded-lg overflow-hidden">
                      <div className="relative">
                        <img
                          src={video.thumbnailUrl}
                          alt={video.title}
                          className="w-full h-64 object-cover"
                        />
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                          <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center">
                            <Play className="w-8 h-8 text-black ml-1" fill="currentColor" />
                          </div>
                        </div>
                        <div className="absolute top-4 left-4 bg-red-600 text-white px-3 py-1 rounded text-xs font-bold animate-pulse">
                          LIVE
                        </div>
                      </div>
                      <div className="p-4">
                        <span className="text-xs text-gray-400">Live</span>
                        <h3 className="text-white font-semibold">{video.title}</h3>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-24">
                  <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-purple-900/30 to-purple-800/30 border border-purple-700/50 flex items-center justify-center mb-6">
                    <Play className="w-16 h-16 text-purple-400/60" />
                  </div>
                  <p className="text-gray-400 text-center text-sm">
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
                recordedVideos.map((video) => (
                  <div key={video.id} data-testid={`video-${video.id}`} className="gradient-border-cyan">
                    <div className="bg-[#1a2332] rounded-lg overflow-hidden">
                      <div className="relative">
                        <img
                          src={video.thumbnailUrl}
                          alt={video.title}
                          className="w-full h-32 object-cover"
                        />
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
                ))
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
    </div>
  );
}
