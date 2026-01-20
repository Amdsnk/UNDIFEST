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
import { CheckSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import type { AppSetting } from "@shared/schema";

export default function WebsiteConfirmPage() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<Record<string, string>>({});

  const { data: settingsData = [], isLoading } = useQuery<AppSetting[]>({
    queryKey: ["/api/admin/settings"],
    onSuccess: (data) => {
      const settingsMap: Record<string, string> = {};
      data.forEach(setting => {
        settingsMap[setting.key] = setting.value;
      });
      setSettings(settingsMap);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { key: string; value: string }[]) => {
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("admin_token")}`,
        },
        body: JSON.stringify({ settings: data }),
      });
      if (!response.ok) throw new Error("Gagal mengupdate settings");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings"] });
      toast({ title: "Konfigurasi verifikasi berhasil diupdate" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const settingsArray = Object.entries(settings).map(([key, value]) => ({ key, value }));
    updateMutation.mutate(settingsArray);
  };

  const handleChange = (key: string, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AdminSidebar />
        <div className="flex-1">
          <AdminPageHeader />
          <main className="p-6 bg-gray-50 min-h-screen">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900">Konfirmasi Website</h1>
              <p className="text-muted-foreground">Konfigurasi verifikasi website untuk SEO dan analytics</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckSquare className="h-5 w-5" />
                    Meta Tags Verifikasi
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="google_site_verification">Google Site Verification</Label>
                    <Input
                      id="google_site_verification"
                      value={settings.google_site_verification || ""}
                      onChange={(e) => handleChange("google_site_verification", e.target.value)}
                      placeholder="google-site-verification=xxxxx"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Dapatkan dari Google Search Console
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="facebook_domain_verification">Facebook Domain Verification</Label>
                    <Input
                      id="facebook_domain_verification"
                      value={settings.facebook_domain_verification || ""}
                      onChange={(e) => handleChange("facebook_domain_verification", e.target.value)}
                      placeholder="xxxxxxxxxxxxxxxxxxxxx"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Dapatkan dari Facebook Business Manager
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="google_analytics_id">Google Analytics ID</Label>
                    <Input
                      id="google_analytics_id"
                      value={settings.google_analytics_id || ""}
                      onChange={(e) => handleChange("google_analytics_id", e.target.value)}
                      placeholder="G-XXXXXXXXXX atau UA-XXXXXXXXX-X"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Tracking ID dari Google Analytics
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="facebook_pixel_id">Facebook Pixel ID</Label>
                    <Input
                      id="facebook_pixel_id"
                      value={settings.facebook_pixel_id || ""}
                      onChange={(e) => handleChange("facebook_pixel_id", e.target.value)}
                      placeholder="123456789012345"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Pixel ID dari Facebook Events Manager
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="meta_description">Meta Description (SEO)</Label>
                    <Textarea
                      id="meta_description"
                      value={settings.meta_description || ""}
                      onChange={(e) => handleChange("meta_description", e.target.value)}
                      placeholder="Deskripsi website untuk SEO (max 160 karakter)"
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label htmlFor="meta_keywords">Meta Keywords (SEO)</Label>
                    <Input
                      id="meta_keywords"
                      value={settings.meta_keywords || ""}
                      onChange={(e) => handleChange("meta_keywords", e.target.value)}
                      placeholder="undian, berhadiah, lottery, indonesia"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Pisahkan dengan koma
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Button type="submit" size="lg">Simpan Perubahan</Button>
            </form>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
