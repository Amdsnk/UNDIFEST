import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminSidebar } from "@/components/AdminSidebar";
import { AdminPageHeader } from "@/components/AdminPageHeader";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Building2, Phone, Share2, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import type { FooterSetting } from "@shared/schema";

const DEFAULTS: Record<string, string> = {
  company_name: "PT. Undian Festival Indonesia",
  address: "Perkantoran Prominence No. 08-99 Jalan Jalur Sutera 900, Alam Sutera RT. 003/ 009. Kab. Tangerang, Banten 15325 Indonesia",
  copyright: "Copyright ©2025\nPT. Undian Festival Indonesia - Undifest. All Right Reserved",
  phone: "021 252515",
  whatsapp: "08889988616",
  telegram_username: "@undifest",
  facebook: "https://facebook.com/undifest",
  twitter: "https://twitter.com/undifest",
  instagram: "https://www.instagram.com/undifest_/",
  youtube: "https://youtube.com/@undifest",
  tiktok: "https://tiktok.com/@undifest",
  telegram: "https://t.me/undifest",
};

export default function FooterPage() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<Record<string, string>>(DEFAULTS);

  const { data: footerData = [], isLoading } = useQuery<FooterSetting[]>({
    queryKey: ["/api/admin/footer"],
  });

  useEffect(() => {
    if (footerData.length > 0) {
      const map: Record<string, string> = { ...DEFAULTS };
      footerData.forEach((s) => {
        map[s.key] = s.value;
      });
      setSettings(map);
    }
  }, [footerData]);

  const updateMutation = useMutation({
    mutationFn: async (data: { key: string; value: string }[]) => {
      const response = await fetch("/api/footer", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("admin_token")}`,
        },
        body: JSON.stringify({ settings: data }),
      });
      if (!response.ok) throw new Error("Gagal mengupdate footer");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/footer"] });
      queryClient.invalidateQueries({ queryKey: ["/api/footer-settings"] });
      toast({ title: "✅ Footer berhasil disimpan" });
    },
    onError: () => {
      toast({ title: "❌ Gagal menyimpan footer", variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const settingsArray = Object.entries(settings).map(([key, value]) => ({ key, value }));
    updateMutation.mutate(settingsArray);
  };

  const set = (key: string, value: string) =>
    setSettings((prev) => ({ ...prev, [key]: value }));

  if (isLoading) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <AdminSidebar />
          <div className="flex-1 flex items-center justify-center">
            <p className="text-gray-500">Memuat data footer...</p>
          </div>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AdminSidebar />
        <div className="flex-1">
          <AdminPageHeader />
          <main className="p-6 bg-gray-50 min-h-screen">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900">Footer Settings</h1>
              <p className="text-muted-foreground">Kelola semua informasi yang tampil di footer website</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">

              {/* Informasi Perusahaan */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Informasi Perusahaan
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="company_name">Nama Perusahaan</Label>
                    <Input
                      id="company_name"
                      value={settings.company_name}
                      onChange={(e) => set("company_name", e.target.value)}
                      placeholder="PT. Undian Festival Indonesia"
                    />
                  </div>
                  <div>
                    <Label htmlFor="address">Alamat</Label>
                    <Textarea
                      id="address"
                      value={settings.address}
                      onChange={(e) => set("address", e.target.value)}
                      placeholder="Alamat lengkap perusahaan"
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label htmlFor="copyright">Teks Copyright</Label>
                    <Textarea
                      id="copyright"
                      value={settings.copyright}
                      onChange={(e) => set("copyright", e.target.value)}
                      placeholder="Copyright ©2025 PT. Undian Festival Indonesia"
                      rows={2}
                    />
                    <p className="text-xs text-gray-500 mt-1">Gunakan baris baru untuk memisahkan dua baris teks.</p>
                  </div>
                </CardContent>
              </Card>

              {/* Kontak */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Phone className="h-5 w-5" />
                    Kontak
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="phone">Nomor Telepon</Label>
                    <Input
                      id="phone"
                      value={settings.phone}
                      onChange={(e) => set("phone", e.target.value)}
                      placeholder="021 252515"
                    />
                  </div>
                  <div>
                    <Label htmlFor="whatsapp">Nomor WhatsApp</Label>
                    <Input
                      id="whatsapp"
                      value={settings.whatsapp}
                      onChange={(e) => set("whatsapp", e.target.value)}
                      placeholder="08889988616"
                    />
                    <p className="text-xs text-gray-500 mt-1">Format: 08xxx — akan otomatis dikonversi ke format internasional untuk link WA.</p>
                  </div>
                  <div>
                    <Label htmlFor="telegram_username">Username Telegram</Label>
                    <Input
                      id="telegram_username"
                      value={settings.telegram_username}
                      onChange={(e) => set("telegram_username", e.target.value)}
                      placeholder="@undifest"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Media Sosial */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Share2 className="h-5 w-5" />
                    Media Sosial
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="facebook">Facebook URL</Label>
                    <Input
                      id="facebook"
                      value={settings.facebook}
                      onChange={(e) => set("facebook", e.target.value)}
                      placeholder="https://facebook.com/undifest"
                    />
                  </div>
                  <div>
                    <Label htmlFor="twitter">X / Twitter URL</Label>
                    <Input
                      id="twitter"
                      value={settings.twitter}
                      onChange={(e) => set("twitter", e.target.value)}
                      placeholder="https://twitter.com/undifest"
                    />
                  </div>
                  <div>
                    <Label htmlFor="instagram">Instagram URL</Label>
                    <Input
                      id="instagram"
                      value={settings.instagram}
                      onChange={(e) => set("instagram", e.target.value)}
                      placeholder="https://www.instagram.com/undifest_/"
                    />
                  </div>
                  <div>
                    <Label htmlFor="youtube">YouTube URL</Label>
                    <Input
                      id="youtube"
                      value={settings.youtube}
                      onChange={(e) => set("youtube", e.target.value)}
                      placeholder="https://youtube.com/@undifest"
                    />
                  </div>
                  <div>
                    <Label htmlFor="tiktok">TikTok URL</Label>
                    <Input
                      id="tiktok"
                      value={settings.tiktok}
                      onChange={(e) => set("tiktok", e.target.value)}
                      placeholder="https://tiktok.com/@undifest"
                    />
                  </div>
                  <div>
                    <Label htmlFor="telegram">Telegram URL</Label>
                    <Input
                      id="telegram"
                      value={settings.telegram}
                      onChange={(e) => set("telegram", e.target.value)}
                      placeholder="https://t.me/undifest"
                    />
                  </div>
                </CardContent>
              </Card>

              <Button type="submit" size="lg" disabled={updateMutation.isPending} className="w-full md:w-auto">
                <Save className="h-4 w-4 mr-2" />
                {updateMutation.isPending ? "Menyimpan..." : "Simpan Semua Perubahan"}
              </Button>
            </form>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
