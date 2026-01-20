import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminSidebar } from "@/components/AdminSidebar";
import { AdminPageHeader } from "@/components/AdminPageHeader";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Palette, FileText, Video, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { AppSetting } from "@shared/schema";

export default function EditLain2Page() {
  const { toast } = useToast();
  const [logoFile, setLogoFile] = useState<File | null>(null);

  const { data: settings = [] } = useQuery<AppSetting[]>({
    queryKey: ["/api/app-settings"],
  });

  const getSetting = (key: string, defaultValue: string = "") => {
    const setting = settings.find(s => s.key === key);
    return setting?.value || defaultValue;
  };

  const updateSettingMutation = useMutation({
    mutationFn: async (data: { key: string; value: string }) => {
      return apiRequest("/api/app-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/app-settings"] });
      toast({ title: "Pengaturan berhasil disimpan" });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Gagal menyimpan pengaturan" });
    },
  });

  const uploadLogoMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("logo", file);
      
      const response = await fetch("/api/upload-logo", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("admin_token")}`,
        },
        body: formData,
      });

      if (!response.ok) throw new Error("Upload failed");
      return response.json();
    },
    onSuccess: (data) => {
      updateSettingMutation.mutate({ key: "site_logo", value: data.logoUrl });
    },
  });

  const handleSaveSetting = (key: string, value: string) => {
    updateSettingMutation.mutate({ key, value });
  };

  const handleLogoUpload = () => {
    if (logoFile) {
      uploadLogoMutation.mutate(logoFile);
    }
  };

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full admin-light">
        <AdminSidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <AdminPageHeader
            title="Edit Lain-Lain"
            description="Kelola konten, tema, dan pengaturan website"
            icon={Settings}
          />

          <main className="flex-1 overflow-auto p-6 bg-gray-50">
            <div className="max-w-6xl mx-auto">
              <Tabs defaultValue="branding" className="space-y-6">
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="branding">
                    <Palette className="w-4 h-4 mr-2" />
                    Branding
                  </TabsTrigger>
                  <TabsTrigger value="pages">
                    <FileText className="w-4 h-4 mr-2" />
                    Halaman
                  </TabsTrigger>
                  <TabsTrigger value="videos">
                    <Video className="w-4 h-4 mr-2" />
                    Video
                  </TabsTrigger>
                  <TabsTrigger value="countdown">
                    <Clock className="w-4 h-4 mr-2" />
                    Countdown
                  </TabsTrigger>
                  <TabsTrigger value="theme">
                    <Palette className="w-4 h-4 mr-2" />
                    Tema
                  </TabsTrigger>
                </TabsList>

                {/* Branding Tab */}
                <TabsContent value="branding">
                  <Card>
                    <CardHeader>
                      <CardTitle>Logo & Identitas Website</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="logo">Logo Website</Label>
                        <Input
                          id="logo"
                          type="file"
                          accept="image/*"
                          onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                        />
                        {getSetting("site_logo") && (
                          <img 
                            src={getSetting("site_logo")} 
                            alt="Current logo" 
                            className="mt-2 h-20 object-contain" 
                          />
                        )}
                        <Button 
                          onClick={handleLogoUpload} 
                          disabled={!logoFile || uploadLogoMutation.isPending}
                          className="mt-2"
                        >
                          {uploadLogoMutation.isPending ? "Uploading..." : "Upload Logo"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Pages Tab */}
                <TabsContent value="pages">
                  <div className="text-center text-gray-500 py-8">
                    Gunakan menu "Kebijakan" dan "Tentang Kami" untuk mengedit halaman
                  </div>
                </TabsContent>

                {/* Videos Tab */}
                <TabsContent value="videos">
                  <div className="text-center text-gray-500 py-8">
                    Gunakan menu "Videos" untuk mengelola video dan live stream
                  </div>
                </TabsContent>

                {/* Countdown Tab */}
                <TabsContent value="countdown">
                  <Card>
                    <CardHeader>
                      <CardTitle>Countdown Live Stream</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="countdown_date">Tanggal & Waktu Live</Label>
                        <Input
                          id="countdown_date"
                          type="datetime-local"
                          defaultValue={getSetting("countdown_date")}
                          onBlur={(e) => handleSaveSetting("countdown_date", e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="countdown_title">Judul Countdown</Label>
                        <Input
                          id="countdown_title"
                          defaultValue={getSetting("countdown_title", "Live dimulai dalam")}
                          onBlur={(e) => handleSaveSetting("countdown_title", e.target.value)}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Theme Tab */}
                <TabsContent value="theme">
                  <Card>
                    <CardHeader>
                      <CardTitle>Warna Tema Website</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="primary_color">Warna Utama</Label>
                          <div className="flex gap-2">
                            <Input
                              id="primary_color"
                              type="color"
                              defaultValue={getSetting("primary_color", "#6366f1")}
                              onBlur={(e) => handleSaveSetting("primary_color", e.target.value)}
                              className="w-20 h-10"
                            />
                            <Input
                              type="text"
                              defaultValue={getSetting("primary_color", "#6366f1")}
                              onBlur={(e) => handleSaveSetting("primary_color", e.target.value)}
                              placeholder="#6366f1"
                            />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="secondary_color">Warna Sekunder</Label>
                          <div className="flex gap-2">
                            <Input
                              id="secondary_color"
                              type="color"
                              defaultValue={getSetting("secondary_color", "#8b5cf6")}
                              onBlur={(e) => handleSaveSetting("secondary_color", e.target.value)}
                              className="w-20 h-10"
                            />
                            <Input
                              type="text"
                              defaultValue={getSetting("secondary_color", "#8b5cf6")}
                              onBlur={(e) => handleSaveSetting("secondary_color", e.target.value)}
                              placeholder="#8b5cf6"
                            />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}


