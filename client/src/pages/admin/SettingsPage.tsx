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
import { Settings, Copy, Check, Globe, Database } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import type { AppSetting } from "@shared/schema";

export default function SettingsPage() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [copiedIP, setCopiedIP] = useState(false);

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

  // Query untuk mendapatkan IP outbound server
  const { data: serverIPData } = useQuery<{ success: boolean; outboundIP: string; message: string }>({
    queryKey: ["/api/server-ip"],
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
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings"] });
      const fonnteSync = result?.fonnteSync;
      if (fonnteSync?.attempted && fonnteSync?.success === false) {
        const detail = typeof fonnteSync.detail === "string"
          ? fonnteSync.detail
          : (fonnteSync.detail?.reason || fonnteSync.detail?.detail || "Unknown error");
        toast({
          variant: "destructive",
          title: "Settings tersimpan, tapi sync Fonnte gagal",
          description: String(detail),
        });
        return;
      }
      if (fonnteSync?.attempted && fonnteSync?.success === true) {
        toast({ title: "Settings & sync Fonnte berhasil" });
        return;
      }
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

  const [migrationResult, setMigrationResult] = useState<string[] | null>(null);
  const [isRunningMigration, setIsRunningMigration] = useState(false);
  const [isLoadingFonnteQr, setIsLoadingFonnteQr] = useState(false);
  const [fonnteQrBase64, setFonnteQrBase64] = useState<string>("");
  const [fonnteQrError, setFonnteQrError] = useState<string>("");

  const runMigration = async () => {
    setIsRunningMigration(true);
    setMigrationResult(null);
    try {
      const response = await fetch("/api/admin/run-migration", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("admin_token")}`,
        },
      });
      const data = await response.json();
      setMigrationResult(data.results || [data.error || "Unknown error"]);
      if (data.success) {
        toast({ title: "✅ Migration berhasil dijalankan!" });
      } else {
        toast({ variant: "destructive", title: "Migration gagal", description: data.error });
      }
    } catch (err: any) {
      setMigrationResult([`Error: ${err.message}`]);
      toast({ variant: "destructive", title: "Migration gagal" });
    } finally {
      setIsRunningMigration(false);
    }
  };

  const copyIPToClipboard = () => {
    if (serverIPData?.outboundIP) {
      navigator.clipboard.writeText(serverIPData.outboundIP);
      setCopiedIP(true);
      toast({ title: "IP berhasil disalin!" });
      setTimeout(() => setCopiedIP(false), 2000);
    }
  };

  const handleConnectFonnte = async () => {
    setIsLoadingFonnteQr(true);
    setFonnteQrError("");
    setFonnteQrBase64("");
    try {
      const response = await fetch("/api/admin/fonnte/connect-qr", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("admin_token")}`,
        },
      });
      const data = await response.json();
      if (!response.ok || !data?.success) {
        const errMsg = data?.error || "Gagal mengambil QR connect Fonnte";
        setFonnteQrError(errMsg);
        toast({ variant: "destructive", title: "Gagal connect Fonnte", description: errMsg });
        return;
      }
      setFonnteQrBase64(data.qrBase64 || "");
      toast({ title: "QR Connect Fonnte berhasil dimuat" });
    } catch (err: any) {
      const errMsg = err?.message || "Gagal mengambil QR connect Fonnte";
      setFonnteQrError(errMsg);
      toast({ variant: "destructive", title: "Gagal connect Fonnte", description: errMsg });
    } finally {
      setIsLoadingFonnteQr(false);
    }
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
              {/* Server IP Card - untuk DOKU whitelist */}
              <Card className="border-blue-200 bg-blue-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-blue-900">
                    <Globe className="h-5 w-5" />
                    Server IP Address (untuk DOKU Whitelist)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="bg-white rounded-lg p-4 border border-blue-200">
                      <Label className="text-sm text-gray-600 mb-2 block">
                        IP Outbound Backend (Railway Production)
                      </Label>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 bg-gray-100 px-4 py-3 rounded font-mono text-lg font-bold text-blue-600">
                          {serverIPData?.outboundIP || "Loading..."}
                        </code>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={copyIPToClipboard}
                          disabled={!serverIPData?.outboundIP}
                          className="h-12 w-12"
                        >
                          {copiedIP ? (
                            <Check className="h-5 w-5 text-green-600" />
                          ) : (
                            <Copy className="h-5 w-5" />
                          )}
                        </Button>
                      </div>
                    </div>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <p className="text-sm text-yellow-800">
                        <strong>📋 Cara Whitelist di DOKU:</strong>
                      </p>
                      <ol className="text-sm text-yellow-800 mt-2 ml-4 list-decimal space-y-1">
                        <li>Login ke DOKU Dashboard</li>
                        <li>Masuk ke menu <strong>Settings → IP Whitelist</strong></li>
                        <li>Tambahkan IP di atas ke whitelist</li>
                        <li>Save dan tunggu beberapa menit untuk aktivasi</li>
                      </ol>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Database Migration Card */}
              <Card className="border-purple-200 bg-purple-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-purple-900">
                    <Database className="h-5 w-5" />
                    Database Migration
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-purple-800">
                    Jalankan ini jika kolom baru (buyer_bank_name, buyer_account_number) belum ada di database.
                  </p>
                  <Button
                    type="button"
                    onClick={runMigration}
                    disabled={isRunningMigration}
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    {isRunningMigration ? "Menjalankan..." : "🔄 Jalankan Migration"}
                  </Button>
                  {migrationResult && (
                    <div className="bg-white rounded-lg p-3 border border-purple-200 space-y-1">
                      {migrationResult.map((r, i) => (
                        <p key={i} className="text-xs font-mono text-gray-700">{r}</p>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    General Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="fonnte_device">Fonnte Device (Nomor WhatsApp Pengirim)</Label>
                    <Input
                      id="fonnte_device"
                      value={settings.fonnte_device || ""}
                      onChange={(e) => handleChange("fonnte_device", e.target.value)}
                      placeholder="08123456789 atau 628123456789"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Ini dipakai untuk memilih device Fonnte saat mengirim WhatsApp. Saat disimpan, backend akan mencoba sinkron ke Fonnte.
                    </p>
                  </div>
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

              <Card className="border-emerald-200 bg-emerald-50">
                <CardHeader>
                  <CardTitle className="text-emerald-900">Connect WhatsApp Fonnte</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-emerald-800">
                    Klik tombol di bawah untuk generate QR connect device Fonnte langsung dari admin dashboard.
                  </p>
                  <Button
                    type="button"
                    onClick={handleConnectFonnte}
                    disabled={isLoadingFonnteQr}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    {isLoadingFonnteQr ? "Mengambil QR..." : "Connect WhatsApp via QR"}
                  </Button>
                  {fonnteQrError && (
                    <p className="text-sm text-red-600">{fonnteQrError}</p>
                  )}
                  {fonnteQrBase64 && (
                    <div className="bg-white border rounded-lg p-4 inline-block">
                      <img
                        src={`data:image/png;base64,${fonnteQrBase64}`}
                        alt="Fonnte Connect QR"
                        className="w-64 h-64 object-contain"
                      />
                    </div>
                  )}
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
