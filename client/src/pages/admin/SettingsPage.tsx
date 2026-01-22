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
import { Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import type { AppSetting } from "@shared/schema";

export default function SettingsPage() {
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
      toast({ title: "Settings berhasil diupdate" });
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
              <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
              <p className="text-muted-foreground">Konfigurasi aplikasi</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    General Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="site_name">Nama Website</Label>
                    <Input
                      id="site_name"
                      value={settings.site_name || ""}
                      onChange={(e) => handleChange("site_name", e.target.value)}
                      placeholder="UNDIFEST"
                    />
                  </div>
                  <div>
                    <Label htmlFor="site_description">Deskripsi Website</Label>
                    <Textarea
                      id="site_description"
                      value={settings.site_description || ""}
                      onChange={(e) => handleChange("site_description", e.target.value)}
                      placeholder="Platform undian berhadiah terpercaya"
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label htmlFor="contact_email">Email Kontak</Label>
                    <Input
                      id="contact_email"
                      type="email"
                      value={settings.contact_email || ""}
                      onChange={(e) => handleChange("contact_email", e.target.value)}
                      placeholder="info@undifest.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="contact_phone">Nomor Telepon</Label>
                    <Input
                      id="contact_phone"
                      value={settings.contact_phone || ""}
                      onChange={(e) => handleChange("contact_phone", e.target.value)}
                      placeholder="+62 812 3456 7890"
                    />
                  </div>
                  <div>
                    <Label htmlFor="contact_address">Alamat</Label>
                    <Textarea
                      id="contact_address"
                      value={settings.contact_address || ""}
                      onChange={(e) => handleChange("contact_address", e.target.value)}
                      placeholder="Jl. Contoh No. 123, Jakarta"
                      rows={2}
                    />
                  </div>
                  <div>
                    <Label htmlFor="whatsapp_number">WhatsApp</Label>
                    <Input
                      id="whatsapp_number"
                      value={settings.whatsapp_number || ""}
                      onChange={(e) => handleChange("whatsapp_number", e.target.value)}
                      placeholder="628123456789"
                    />
                  </div>
                  <div>
                    <Label htmlFor="instagram_url">Instagram URL</Label>
                    <Input
                      id="instagram_url"
                      value={settings.instagram_url || ""}
                      onChange={(e) => handleChange("instagram_url", e.target.value)}
                      placeholder="https://instagram.com/undifest"
                    />
                  </div>
                  <div>
                    <Label htmlFor="facebook_url">Facebook URL</Label>
                    <Input
                      id="facebook_url"
                      value={settings.facebook_url || ""}
                      onChange={(e) => handleChange("facebook_url", e.target.value)}
                      placeholder="https://facebook.com/undifest"
                    />
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
