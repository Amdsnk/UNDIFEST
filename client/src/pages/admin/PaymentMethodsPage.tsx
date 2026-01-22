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
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2, CreditCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import type { PaymentMethod } from "@shared/schema";

export default function PaymentMethodsPage() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    type: "bank_transfer" as "bank_transfer" | "ewallet" | "qris",
    logoUrl: "",
    instructions: "",
    isActive: true,
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);

  const { data: methods = [], isLoading } = useQuery<PaymentMethod[]>({
    queryKey: ["/api/admin/payment-methods"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await fetch("/api/payment-methods", {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("admin_token")}` },
        body: data,
      });
      if (!response.ok) throw new Error("Gagal menambahkan metode pembayaran");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/payment-methods"] });
      toast({ title: "Metode pembayaran berhasil ditambahkan" });
      resetForm();
      setIsDialogOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: FormData }) => {
      const response = await fetch(`/api/payment-methods/${id}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${localStorage.getItem("admin_token")}` },
        body: data,
      });
      if (!response.ok) throw new Error("Gagal mengupdate metode pembayaran");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/payment-methods"] });
      toast({ title: "Metode pembayaran berhasil diupdate" });
      resetForm();
      setIsDialogOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/payment-methods/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("admin_token")}` },
      });
      if (!response.ok) throw new Error("Gagal menghapus metode pembayaran");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/payment-methods"] });
      toast({ title: "Metode pembayaran berhasil dihapus" });
    },
  });

  const resetForm = () => {
    setFormData({ name: "", type: "bank_transfer", logoUrl: "", instructions: "", isActive: true });
    setLogoFile(null);
    setEditingMethod(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formDataToSend = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      formDataToSend.append(key, value.toString());
    });
    if (logoFile) formDataToSend.append("logo", logoFile);
    
    if (editingMethod) {
      updateMutation.mutate({ id: editingMethod.id, data: formDataToSend });
    } else {
      createMutation.mutate(formDataToSend);
    }
  };

  const handleEdit = (method: PaymentMethod) => {
    setEditingMethod(method);
    setFormData({
      name: method.name,
      type: method.type,
      logoUrl: method.logoUrl || "",
      instructions: method.instructions || "",
      isActive: method.isActive,
    });
    setIsDialogOpen(true);
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      bank_transfer: "Transfer Bank",
      ewallet: "E-Wallet",
      qris: "QRIS",
    };
    return labels[type] || type;
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
                <h1 className="text-3xl font-bold text-gray-900">Metode Pembayaran</h1>
                <p className="text-muted-foreground">Kelola metode pembayaran yang tersedia</p>
              </div>
              <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
                <DialogTrigger asChild>
                  <Button><Plus className="mr-2 h-4 w-4" />Tambah Metode</Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>{editingMethod ? "Edit Metode" : "Tambah Metode Baru"}</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <Label>Nama Metode</Label>
                      <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="BCA, GoPay, QRIS" required />
                    </div>
                    <div>
                      <Label>Tipe</Label>
                      <Select value={formData.type} onValueChange={(value: any) => setFormData({ ...formData, type: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="bank_transfer">Transfer Bank</SelectItem>
                          <SelectItem value="ewallet">E-Wallet</SelectItem>
                          <SelectItem value="qris">QRIS</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Logo</Label>
                      <Input type="file" accept="image/*" onChange={(e) => setLogoFile(e.target.files?.[0] || null)} />
                      {formData.logoUrl && !logoFile && <img src={formData.logoUrl} alt="Logo" className="mt-2 h-12" />}
                    </div>
                    <div>
                      <Label>Instruksi Pembayaran</Label>
                      <Textarea value={formData.instructions} onChange={(e) => setFormData({ ...formData, instructions: e.target.value })} placeholder="Cara melakukan pembayaran..." rows={4} />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch checked={formData.isActive} onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })} />
                      <Label>Aktif</Label>
                    </div>
                    <Button type="submit" className="w-full">{editingMethod ? "Update" : "Tambah"}</Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><CreditCard className="h-5 w-5" />Daftar Metode Pembayaran</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? <p>Loading...</p> : methods.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Belum ada metode pembayaran</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Logo</TableHead>
                        <TableHead>Nama</TableHead>
                        <TableHead>Tipe</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {methods.map((method) => (
                        <TableRow key={method.id}>
                          <TableCell>{method.logoUrl && <img src={method.logoUrl} alt={method.name} className="h-8" />}</TableCell>
                          <TableCell className="font-medium">{method.name}</TableCell>
                          <TableCell>{getTypeLabel(method.type)}</TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs ${method.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
                              {method.isActive ? "Aktif" : "Nonaktif"}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" onClick={() => handleEdit(method)}><Pencil className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="sm" onClick={() => { if (confirm("Hapus metode ini?")) deleteMutation.mutate(method.id); }}>
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

