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
import { Trash2, Video as VideoIcon, Plus, Play, Upload, Home } from "lucide-react";

export default function VideosPage() {
  const [formData, setFormData] = useState({
    title: "",
    thumbnailUrl: "",
    videoUrl: "",
    videoFile: "",
    type: "video",
    isLive: false,
    showOnHomepage: false,
    displayOrder: 0,
  });
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [uploadingVideo, setUploadingVideo] = useState(false);
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
        videoFile: "",
        type: "video",
        isLive: false,
        showOnHomepage: false,
        displayOrder: 0,
      });
      setVideoFile(null);
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Gagal Menambahkan Video",
        description: error.message,
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<typeof formData> }) => {
      const response = await fetch(`/api/videos/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("admin_token")}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Gagal mengupdate video");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/videos"] });
      toast({
        title: "Video Berhasil Diupdate",
        description: "Perubahan telah disimpan",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Gagal Mengupdate Video",
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

  const handleVideoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size on client side (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast({
        variant: "destructive",
        title: "Video Terlalu Besar",
        description: `Ukuran video ${(file.size / 1024 / 1024).toFixed(2)}MB. Maksimal 10MB untuk upload lokal. Gunakan YouTube/Vimeo URL untuk video lebih besar.`,
      });
      e.target.value = ''; // Reset input
      return;
    }

    setVideoFile(file);
    setUploadingVideo(true);

    try {
      const formData = new FormData();
      formData.append('video', file);

      const response = await fetch('/api/videos/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem("admin_token")}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Gagal mengupload video');
      }

      const data = await response.json();
      setFormData(prev => ({ ...prev, videoFile: data.videoFile }));

      toast({
        title: "Video Berhasil Diupload",
        description: `File video ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB) telah diupload ke server`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Gagal Upload Video",
        description: error instanceof Error ? error.message : "Terjadi kesalahan",
      });
      setVideoFile(null);
      e.target.value = ''; // Reset input
    } finally {
      setUploadingVideo(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate that at least one video source is provided
    if (!formData.videoUrl && !formData.videoFile) {
      toast({
        variant: "destructive",
        title: "Video Diperlukan",
        description: "Silakan masukkan URL video atau upload file video",
      });
      return;
    }

    createMutation.mutate(formData);
  };

  const handleDelete = (videoId: string) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus video ini?")) {
      deleteMutation.mutate(videoId);
    }
  };

  const handleToggleHomepage = (videoId: string, currentValue: boolean) => {
    updateMutation.mutate({
      id: videoId,
      data: { showOnHomepage: !currentValue },
    });
  };

  return (
    <SidebarProvider>
      <AdminSidebar />
      <div className="flex flex-col flex-1 min-h-screen admin-light bg-gray-50">
        <AdminPageHeader
          title="Video Management"
          description="Kelola video dan live streaming"
          breadcrumbs={[
            { label: "Home", href: "/admin-panel-7x9k/dashboard" },
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
                      <Label htmlFor="thumbnailUrl" className="text-base font-semibold text-gray-700">URL Thumbnail (Opsional)</Label>
                      <Input
                        id="thumbnailUrl"
                        value={formData.thumbnailUrl}
                        onChange={(e) => setFormData({ ...formData, thumbnailUrl: e.target.value })}
                        placeholder="https://example.com/thumbnail.jpg (opsional - video akan auto-play)"
                        className="h-12 border-2 border-gray-200 focus:border-purple-400"
                      />
                      <p className="text-sm text-gray-500">Kosongkan jika ingin video auto-play seperti Shopee</p>
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
                    <p className="text-sm text-gray-500">Gunakan URL YouTube/Vimeo untuk video besar (&gt;10MB)</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="videoFile" className="text-base font-semibold text-gray-700">Upload Video Lokal (Max 10MB)</Label>
                    <div className="flex items-center gap-3">
                      <Input
                        id="videoFile"
                        type="file"
                        accept="video/*"
                        onChange={handleVideoFileChange}
                        className="h-12 border-2 border-gray-200 focus:border-purple-400"
                        disabled={uploadingVideo}
                      />
                      {uploadingVideo && (
                        <div className="flex items-center gap-2 text-purple-600">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-600"></div>
                          <span className="text-sm font-medium">Uploading...</span>
                        </div>
                      )}
                    </div>
                    {formData.videoFile && (
                      <p className="text-sm text-green-600 font-medium">✓ Video uploaded: {formData.videoFile}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                    <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border-2 border-blue-200">
                      <Switch
                        checked={formData.showOnHomepage}
                        onCheckedChange={(checked) => setFormData({ ...formData, showOnHomepage: checked })}
                        className="data-[state=checked]:bg-blue-500"
                      />
                      <Label className="text-base font-semibold cursor-pointer flex items-center gap-2">
                        <Home className="w-4 h-4" />
                        {formData.showOnHomepage ? "Tampil di Homepage" : "Tidak di Homepage"}
                      </Label>
                    </div>
                  </div>

                  {formData.showOnHomepage && (
                    <div className="space-y-2">
                      <Label htmlFor="displayOrder" className="text-base font-semibold text-gray-700">Urutan Tampilan (0-3)</Label>
                      <Input
                        id="displayOrder"
                        type="number"
                        min="0"
                        max="3"
                        value={formData.displayOrder}
                        onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })}
                        placeholder="0"
                        className="h-12 border-2 border-gray-200 focus:border-purple-400"
                      />
                      <p className="text-sm text-gray-500">Urutan 0 = pertama, 1 = kedua, dst. Maksimal 4 video di homepage.</p>
                    </div>
                  )}

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
                          {video.videoFile ? (
                            <video
                              src={video.videoFile}
                              className="w-48 h-28 object-cover rounded-xl shadow-md border-2 border-gray-200"
                              muted
                              loop
                              playsInline
                            />
                          ) : video.thumbnailUrl ? (
                            <>
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
                            </>
                          ) : (
                            <div className="w-48 h-28 bg-gray-200 rounded-xl shadow-md border-2 border-gray-300 flex items-center justify-center">
                              <VideoIcon className="w-12 h-12 text-gray-400" />
                            </div>
                          )}
                        </div>

                        <div className="flex-1">
                          <h3 className="font-bold text-gray-900 text-lg">{video.title}</h3>
                          <div className="flex items-center gap-3 mt-2 flex-wrap">
                            {video.isLive && (
                              <span className="inline-flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-red-500 to-pink-600 text-white text-xs font-bold rounded-full shadow-md animate-pulse">
                                LIVE
                              </span>
                            )}
                            {video.showOnHomepage && (
                              <span className="inline-flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-blue-500 to-cyan-600 text-white text-xs font-bold rounded-full shadow-md">
                                <Home className="w-3 h-3" />
                                HOMEPAGE #{video.displayOrder}
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
                          <div className="flex items-center gap-4 mt-2">
                            {video.videoUrl && (
                              <a
                                href={video.videoUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 hover:underline font-semibold"
                              >
                                <Play className="w-4 h-4" />
                                Lihat Video
                              </a>
                            )}
                            {video.videoFile && (
                              <span className="inline-flex items-center gap-1 text-sm text-green-600 font-semibold">
                                <Upload className="w-4 h-4" />
                                Video Lokal
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="flex flex-col items-center gap-2">
                            <Switch
                              checked={video.showOnHomepage || false}
                              onCheckedChange={() => handleToggleHomepage(video.id, video.showOnHomepage || false)}
                              disabled={updateMutation.isPending}
                              className="data-[state=checked]:bg-blue-500"
                            />
                            <span className="text-xs text-gray-500 font-medium">Homepage</span>
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


