import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminSidebar } from "@/components/AdminSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AdminPageHeader } from "@/components/AdminPageHeader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";
import type { Video } from "@shared/schema";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Video as VideoIcon, Plus, Play } from "lucide-react";

export default function VideosPage() {
  const [formData, setFormData] = useState({
    title: "",
    thumbnailUrl: "",
    videoUrl: "",
    type: "video",
    isLive: false,
  });
  const { toast } = useToast();

  const { data: videos, isLoading } = useQuery<Video[]>({
    queryKey: ["/api/videos"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await fetch("/api/videos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("admin_token")}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Gagal menambahkan video");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/videos"] });
      toast({
        title: "Video Berhasil Ditambahkan",
        description: "Video baru telah ditambahkan ke sistem",
      });
      setFormData({
        title: "",
        thumbnailUrl: "",
        videoUrl: "",
        type: "video",
        isLive: false,
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Gagal Menambahkan Video",
        description: error.message,
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (videoId: string) => {
      const response = await fetch(`/api/videos/${videoId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("admin_token")}`,
        },
      });

      if (!response.ok) {
        throw new Error("Gagal menghapus video");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/videos"] });
      toast({
        title: "Video Berhasil Dihapus",
        description: "Video telah dihapus dari sistem",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Gagal Menghapus Video",
        description: error.message,
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const handleDelete = (videoId: string) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus video ini?")) {
      deleteMutation.mutate(videoId);
    }
  };

  return (
    <SidebarProvider>
      <AdminSidebar />
      <div className="flex flex-col flex-1 min-h-screen admin-light bg-gray-50">
        <AdminPageHeader
          title="Video Management"
          description="Kelola video dan live streaming"
          breadcrumbs={[
            { label: "Home", href: "/admin/dashboard" },
            { label: "Videos" },
          ]}
        />

        <div className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Add Video Form */}
            <Card className="border-0 shadow-lg">
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6 rounded-t-xl">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Plus className="w-6 h-6" />
                  Tambah Video Baru
                </h2>
                <p className="text-purple-100 mt-1">Tambahkan video atau live streaming</p>
              </div>

              <CardContent className="p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="title" className="text-base font-semibold text-gray-700">Judul Video</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="Masukkan judul video"
                        required
                        className="h-12 border-2 border-gray-200 focus:border-purple-400"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="thumbnailUrl" className="text-base font-semibold text-gray-700">URL Thumbnail</Label>
                      <Input
                        id="thumbnailUrl"
                        value={formData.thumbnailUrl}
                        onChange={(e) => setFormData({ ...formData, thumbnailUrl: e.target.value })}
                        placeholder="https://example.com/thumbnail.jpg"
                        required
                        className="h-12 border-2 border-gray-200 focus:border-purple-400"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="videoUrl" className="text-base font-semibold text-gray-700">URL Video (YouTube/Vimeo)</Label>
                    <Input
                      id="videoUrl"
                      value={formData.videoUrl}
                      onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                      placeholder="https://youtube.com/watch?v=..."
                      className="h-12 border-2 border-gray-200 focus:border-purple-400"
                    />
                  </div>

                  <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-red-50 to-pink-50 rounded-xl border-2 border-red-200">
                    <Switch
                      checked={formData.isLive}
                      onCheckedChange={(checked) => setFormData({ ...formData, isLive: checked })}
                      className="data-[state=checked]:bg-red-500"
                    />
                    <Label className="text-base font-semibold cursor-pointer">
                      {formData.isLive ? "Live Streaming Aktif" : "Video Biasa"}
                    </Label>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold shadow-lg h-12"
                    disabled={createMutation.isPending}
                  >
                    {createMutation.isPending ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Menambahkan...</span>
                      </div>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-2" />
                        Tambah Video
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Video List */}
            <Card className="border-0 shadow-lg">
              <div className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white p-6 rounded-t-xl">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <VideoIcon className="w-6 h-6" />
                  Daftar Video
                </h2>
                <p className="text-blue-100 mt-1">
                  {videos?.length || 0} video tersedia
                </p>
              </div>

              <CardContent className="p-6">
                {isLoading ? (
                  <div className="text-center py-12">
                    <div className="flex flex-col items-center gap-3">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                      <p className="text-gray-500 font-medium">Memuat video...</p>
                    </div>
                  </div>
                ) : videos && videos.length > 0 ? (
                  <div className="grid grid-cols-1 gap-4">
                    {videos.map((video, index) => (
                      <div
                        key={video.id}
                        className="flex items-center gap-6 p-5 border-2 border-gray-200 rounded-xl hover:bg-purple-50/50 hover:border-purple-300 transition-all shadow-sm"
                      >
                        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold text-lg shadow-md">
                          {index + 1}
                        </div>

                        <div className="relative group">
                          <img
                            src={video.thumbnailUrl}
                            alt={video.title}
                            className="w-48 h-28 object-cover rounded-xl shadow-md border-2 border-gray-200"
                          />
                          {video.videoUrl && (
                            <div className="absolute inset-0 bg-black/40 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <Play className="w-12 h-12 text-white" />
                            </div>
                          )}
                        </div>

                        <div className="flex-1">
                          <h3 className="font-bold text-gray-900 text-lg">{video.title}</h3>
                          <div className="flex items-center gap-3 mt-2">
                            {video.isLive && (
                              <span className="inline-flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-red-500 to-pink-600 text-white text-xs font-bold rounded-full shadow-md animate-pulse">
                                LIVE
                              </span>
                            )}
                            <span className="text-sm text-gray-500 font-medium">
                              {new Date(video.createdAt).toLocaleDateString('id-ID', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric'
                              })}
                            </span>
                          </div>
                          {video.videoUrl && (
                            <a
                              href={video.videoUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 hover:underline mt-2 font-semibold"
                            >
                              <Play className="w-4 h-4" />
                              Lihat Video
                            </a>
                          )}
                        </div>

                        <Button
                          size="sm"
                          onClick={() => handleDelete(video.id)}
                          disabled={deleteMutation.isPending}
                          className="bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 text-white font-semibold shadow-md"
                        >
                          {deleteMutation.isPending ? (
                            <div className="flex items-center gap-2">
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                            </div>
                          ) : (
                            <>
                              <Trash2 className="w-4 h-4 mr-1" />
                              Hapus
                            </>
                          )}
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="flex flex-col items-center gap-3">
                      <div className="bg-gray-100 rounded-full p-4">
                        <VideoIcon className="w-12 h-12 text-gray-400" />
                      </div>
                      <div>
                        <p className="text-gray-900 font-semibold text-lg">Belum ada video</p>
                        <p className="text-sm text-gray-500 mt-1">Tambahkan video pertama Anda untuk memulai</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
}


