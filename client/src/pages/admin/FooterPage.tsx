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
import { Archive } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import type { FooterSetting } from "@shared/schema";

export default function FooterPage() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<Record<string, string>>({});

  const { data: footerData = [], isLoading } = useQuery<FooterSetting[]>({
    queryKey: ["/api/admin/footer"],
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
      toast({ title: "Footer berhasil diupdate" });
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
              <h1 className="text-3xl font-bold text-gray-900">Footer Settings</h1>
              <p className="text-muted-foreground">Kelola informasi footer website</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Archive className="h-5 w-5" />
                    Footer Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="company_name">Nama Perusahaan</Label>
                    <Input
                      id="company_name"
                      value={settings.company_name || ""}
                      onChange={(e) => handleChange("company_name", e.target.value)}
                      placeholder="UNDIFEST"
                    />
                  </div>
                  <div>
                    <Label htmlFor="company_description">Deskripsi Singkat</Label>
                    <Textarea
                      id="company_description"
                      value={settings.company_description || ""}
                      onChange={(e) => handleChange("company_description", e.target.value)}
                      placeholder="Platform undian berhadiah terpercaya di Indonesia"
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label htmlFor="footer_email">Email</Label>
                    <Input
                      id="footer_email"
                      type="email"
                      value={settings.footer_email || ""}
                      onChange={(e) => handleChange("footer_email", e.target.value)}
                      placeholder="info@undifest.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="footer_phone">Telepon</Label>
                    <Input
                      id="footer_phone"
                      value={settings.footer_phone || ""}
                      onChange={(e) => handleChange("footer_phone", e.target.value)}
                      placeholder="+62 812 3456 7890"
                    />
                  </div>
                  <div>
                    <Label htmlFor="footer_address">Alamat</Label>
                    <Textarea
                      id="footer_address"
                      value={settings.footer_address || ""}
                      onChange={(e) => handleChange("footer_address", e.target.value)}
                      placeholder="Jl. Contoh No. 123, Jakarta"
                      rows={2}
                    />
                  </div>
                  <div>
                    <Label htmlFor="copyright_text">Copyright Text</Label>
                    <Input
                      id="copyright_text"
                      value={settings.copyright_text || ""}
                      onChange={(e) => handleChange("copyright_text", e.target.value)}
                      placeholder="© 2024 UNDIFEST. All rights reserved."
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
