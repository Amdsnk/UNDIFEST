import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminSidebar } from "@/components/AdminSidebar";
import { AdminPageHeader } from "@/components/AdminPageHeader";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import type { IpWhitelist } from "@shared/schema";

export default function IpWhitelistPage() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({ ipAddress: "", description: "", isActive: true });

  const { data: ips = [], isLoading } = useQuery<IpWhitelist[]>({
    queryKey: ["/api/admin/ip-whitelist"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await fetch("/api/ip-whitelist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("admin_token")}`,
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Gagal menambahkan IP");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/ip-whitelist"] });
      toast({ title: "IP berhasil ditambahkan" });
      setFormData({ ipAddress: "", description: "", isActive: true });
      setIsDialogOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/ip-whitelist/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("admin_token")}` },
      });
      if (!response.ok) throw new Error("Gagal menghapus IP");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/ip-whitelist"] });
      toast({ title: "IP berhasil dihapus" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AdminSidebar />
        <div className="flex-1">
          <AdminPageHeader />
          <main className="p-6 bg-gray-50 min-h-screen">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">IP Whitelist</h1>
                <p className="text-muted-foreground">Kelola IP yang diizinkan mengakses admin</p>
              </div>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button><Plus className="mr-2 h-4 w-4" />Tambah IP</Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Tambah IP Whitelist</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <Label>IP Address</Label>
                      <Input value={formData.ipAddress} onChange={(e) => setFormData({ ...formData, ipAddress: e.target.value })} placeholder="192.168.1.1" required />
                    </div>
                    <div>
                      <Label>Deskripsi</Label>
                      <Input value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Office IP" />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch checked={formData.isActive} onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })} />
                      <Label>Aktif</Label>
                    </div>
                    <Button type="submit" className="w-full">Tambah</Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5" />Daftar IP Whitelist</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? <p>Loading...</p> : ips.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Belum ada IP whitelist</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>IP Address</TableHead>
                        <TableHead>Deskripsi</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Tanggal Ditambahkan</TableHead>
                        <TableHead className="text-right">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ips.map((ip) => (
                        <TableRow key={ip.id}>
                          <TableCell className="font-mono">{ip.ipAddress}</TableCell>
                          <TableCell>{ip.description || "-"}</TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs ${ip.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
                              {ip.isActive ? "Aktif" : "Nonaktif"}
                            </span>
                          </TableCell>
                          <TableCell>{new Date(ip.createdAt).toLocaleDateString("id-ID")}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" onClick={() => { if (confirm("Hapus IP ini?")) deleteMutation.mutate(ip.id); }}>
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
