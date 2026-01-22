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
import { Plus, Pencil, Trash2, Building2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import type { Bank } from "@shared/schema";

export default function BanksPage() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBank, setEditingBank] = useState<Bank | null>(null);
  const [formData, setFormData] = useState({
    bankName: "",
    accountNumber: "",
    accountName: "",
    logoUrl: "",
    isActive: true,
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);

  const { data: banks = [], isLoading } = useQuery<Bank[]>({
    queryKey: ["/api/admin/banks"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await fetch("/api/banks", {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("admin_token")}` },
        body: data,
      });
      if (!response.ok) throw new Error("Gagal menambahkan bank");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/banks"] });
      toast({ title: "Bank berhasil ditambahkan" });
      resetForm();
      setIsDialogOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: FormData }) => {
      const response = await fetch(`/api/banks/${id}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${localStorage.getItem("admin_token")}` },
        body: data,
      });
      if (!response.ok) throw new Error("Gagal mengupdate bank");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/banks"] });
      toast({ title: "Bank berhasil diupdate" });
      resetForm();
      setIsDialogOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/banks/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("admin_token")}` },
      });
      if (!response.ok) throw new Error("Gagal menghapus bank");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/banks"] });
      toast({ title: "Bank berhasil dihapus" });
    },
  });

  const resetForm = () => {
    setFormData({ bankName: "", accountNumber: "", accountName: "", logoUrl: "", isActive: true });
    setLogoFile(null);
    setEditingBank(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formDataToSend = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      formDataToSend.append(key, value.toString());
    });
    if (logoFile) formDataToSend.append("logo", logoFile);
    
    if (editingBank) {
      updateMutation.mutate({ id: editingBank.id, data: formDataToSend });
    } else {
      createMutation.mutate(formDataToSend);
    }
  };

  const handleEdit = (bank: Bank) => {
    setEditingBank(bank);
    setFormData({
      bankName: bank.bankName,
      accountNumber: bank.accountNumber,
      accountName: bank.accountName,
      logoUrl: bank.logoUrl || "",
      isActive: bank.isActive,
    });
    setIsDialogOpen(true);
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
                <h1 className="text-3xl font-bold text-gray-900">Bank Management</h1>
                <p className="text-muted-foreground">Kelola rekening bank untuk pembayaran</p>
              </div>
              <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
                <DialogTrigger asChild>
                  <Button><Plus className="mr-2 h-4 w-4" />Tambah Bank</Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>{editingBank ? "Edit Bank" : "Tambah Bank Baru"}</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <Label>Nama Bank</Label>
                      <Input value={formData.bankName} onChange={(e) => setFormData({ ...formData, bankName: e.target.value })} required />
                    </div>
                    <div>
                      <Label>Nomor Rekening</Label>
                      <Input value={formData.accountNumber} onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })} required />
                    </div>
                    <div>
                      <Label>Nama Pemilik</Label>
                      <Input value={formData.accountName} onChange={(e) => setFormData({ ...formData, accountName: e.target.value })} required />
                    </div>
                    <div>
                      <Label>Logo Bank</Label>
                      <Input type="file" accept="image/*" onChange={(e) => setLogoFile(e.target.files?.[0] || null)} />
                      {formData.logoUrl && !logoFile && <img src={formData.logoUrl} alt="Logo" className="mt-2 h-12" />}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch checked={formData.isActive} onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })} />
                      <Label>Aktif</Label>
                    </div>
                    <Button type="submit" className="w-full">{editingBank ? "Update" : "Tambah"}</Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Building2 className="h-5 w-5" />Daftar Bank</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? <p>Loading...</p> : banks.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Belum ada bank</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Logo</TableHead>
                        <TableHead>Bank</TableHead>
                        <TableHead>No. Rekening</TableHead>
                        <TableHead>Atas Nama</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {banks.map((bank) => (
                        <TableRow key={bank.id}>
                          <TableCell>{bank.logoUrl && <img src={bank.logoUrl} alt={bank.bankName} className="h-8" />}</TableCell>
                          <TableCell className="font-medium">{bank.bankName}</TableCell>
                          <TableCell>{bank.accountNumber}</TableCell>
                          <TableCell>{bank.accountName}</TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs ${bank.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
                              {bank.isActive ? "Aktif" : "Nonaktif"}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" onClick={() => handleEdit(bank)}><Pencil className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="sm" onClick={() => { if (confirm("Hapus bank ini?")) deleteMutation.mutate(bank.id); }}>
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

