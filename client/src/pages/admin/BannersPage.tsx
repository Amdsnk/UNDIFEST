import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminSidebar } from "@/components/AdminSidebar";
import { AdminPageHeader } from "@/components/AdminPageHeader";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useState, useRef } from "react";
import type { Banner } from "@shared/schema";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Image, Upload, Trash2 } from "lucide-react";

export default function BannersPage() {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [order, setOrder] = useState<string>("0");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const { data: banners, isLoading } = useQuery<Banner[]>({
    queryKey: ["/api/banners"],
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("image", file);
      formData.append("order", order);

      const response = await fetch("/api/banners/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("admin_token")}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Gagal upload banner");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/banners"] });
      toast({
        title: "Banner Berhasil Ditambahkan",
        description: "Banner baru telah ditambahkan ke slideshow",
      });
      setImageFile(null);
      setOrder("0");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Gagal Upload Banner",
        description: error.message,
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (bannerId: string) => {
      const response = await fetch(`/api/banners/${bannerId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("admin_token")}`,
        },
      });

      if (!response.ok) {
        throw new Error("Gagal menghapus banner");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/banners"] });
      toast({
        title: "Banner Berhasil Dihapus",
        description: "Banner telah dihapus dari slideshow",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Gagal Menghapus Banner",
        description: error.message,
      });
    },
  });

  const handleUpload = () => {
    if (!imageFile) {
      toast({
        variant: "destructive",
        title: "File Tidak Dipilih",
        description: "Silakan pilih file gambar terlebih dahulu",
      });
      return;
    }
    uploadMutation.mutate(imageFile);
  };

  const handleDelete = (bannerId: string) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus banner ini?")) {
      deleteMutation.mutate(bannerId);
    }
  };

  return (
    <SidebarProvider>
      <AdminSidebar />
      <div className="flex flex-col flex-1 min-h-screen admin-light bg-gray-50">
        <AdminPageHeader
          title="Slideshow / Banner"
          description="Kelola banner slideshow untuk halaman utama"
          breadcrumbs={[
            { label: "Home", href: "/admin-panel-7x9k/dashboard" },
            { label: "Content", href: "#" },
            { label: "Banners" }
          ]}
        />

        <div className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Upload Section */}
            <Card className="border-0 shadow-lg">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-xl">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Upload className="w-6 h-6" />
                  Tambah Banner Baru
                </h2>
                <p className="text-blue-100 mt-1">Upload gambar banner untuk slideshow</p>
              </div>

              <CardContent className="p-6">
                {/* Info */}
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800 font-medium">
                    ✅ Gambar akan disimpan langsung di database (permanen). Maksimal ukuran file: 5MB.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-base font-semibold text-gray-700">Gambar Banner</Label>
                    <div className="flex flex-col gap-3">
                      <Input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        data-testid="input-banner"
                        onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                        className="h-12 border-2 border-gray-200 focus:border-purple-400"
                      />
                      {imageFile && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                          <p className="text-sm text-green-700 font-medium">File dipilih: {imageFile.name}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-base font-semibold text-gray-700">Urutan (Order)</Label>
                    <Input
                      type="number"
                      value={order}
                      onChange={(e) => setOrder(e.target.value)}
                      placeholder="0"
                      className="h-12 border-2 border-gray-200 focus:border-purple-400"
                    />
                    <p className="text-sm text-gray-500">Semakin kecil angka, semakin awal ditampilkan</p>
                  </div>
                </div>

                <div className="mt-6">
                  <Button
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold shadow-lg h-12 px-8"
                    data-testid="button-upload"
                    onClick={handleUpload}
                    disabled={uploadMutation.isPending}
                  >
                    {uploadMutation.isPending ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Menyimpan...</span>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Tambah Banner
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Banner List */}
            <Card className="border-0 shadow-lg">
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6 rounded-t-xl">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Image className="w-6 h-6" />
                  Daftar Banner
                </h2>
                <p className="text-purple-100 mt-1">
                  {banners?.length || 0} banner aktif
                </p>
              </div>

              <CardContent className="p-0">
                {isLoading ? (
                  <div className="p-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                      <p className="text-gray-500 font-medium">Memuat banner...</p>
                    </div>
                  </div>
                ) : banners && banners.length > 0 ? (
                  <div className="divide-y divide-gray-200">
                    {banners.map((banner, index) => (
                      <div
                        key={banner.id}
                        data-testid={`banner-${banner.id}`}
                        className="p-6 hover:bg-purple-50/50 transition-colors"
                      >
                        <div className="flex items-center justify-between gap-6">
                          <div className="flex items-center gap-6 flex-1">
                            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold text-lg shadow-md">
                              {String(banner.order).padStart(2, "0")}
                            </div>
                            <div className="flex-1">
                              <img
                                src={banner.imageUrl}
                                alt={`Banner ${banner.order}`}
                                className="w-full max-w-md h-32 object-cover rounded-xl shadow-md border-2 border-gray-200"
                              />
                            </div>
                          </div>
                          <Button
                            size="sm"
                            data-testid={`button-delete-${banner.id}`}
                            onClick={() => handleDelete(banner.id)}
                            disabled={deleteMutation.isPending}
                            className="bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 text-white font-semibold shadow-md"
                          >
                            {deleteMutation.isPending ? (
                              <div className="flex items-center gap-2">
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                                <span>Menghapus...</span>
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
                  <div className="p-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="bg-gray-100 rounded-full p-4">
                        <Image className="w-12 h-12 text-gray-400" />
                      </div>
                      <div>
                        <p className="text-gray-900 font-semibold text-lg">Belum ada banner</p>
                        <p className="text-sm text-gray-500 mt-1">Upload banner pertama Anda untuk memulai</p>
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
