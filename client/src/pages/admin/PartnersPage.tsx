import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminSidebar } from "@/components/AdminSidebar";
import { AdminPageHeader } from "@/components/AdminPageHeader";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Handshake } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import type { Partner } from "@shared/schema";

export default function PartnersPage() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    logoUrl: "",
    websiteUrl: "",
    order: 0,
    isActive: true,
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);

  const { data: partners = [], isLoading } = useQuery<Partner[]>({
    queryKey: ["/api/admin/partners"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await fetch("/api/partners", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("admin_token")}`,
        },
        body: data,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Gagal menambahkan partner");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/partners"] });
      toast({ title: "Partner berhasil ditambahkan" });
      resetForm();
      setIsDialogOpen(false);
    },
    onError: () => {
      toast({ title: "Gagal menambahkan partner", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: FormData }) => {
      const response = await fetch(`/api/partners/${id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("admin_token")}`,
        },
        body: data,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Gagal mengupdate partner");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/partners"] });
      toast({ title: "Partner berhasil diupdate" });
      resetForm();
      setIsDialogOpen(false);
    },
    onError: () => {
      toast({ title: "Gagal mengupdate partner", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/partners/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("admin_token")}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Gagal menghapus partner");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/partners"] });
      toast({ title: "Partner berhasil dihapus" });
    },
    onError: () => {
      toast({ title: "Gagal menghapus partner", variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      logoUrl: "",
      websiteUrl: "",
      order: 0,
      isActive: true,
    });
    setLogoFile(null);
    setEditingPartner(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const formDataToSend = new FormData();
    formDataToSend.append("name", formData.name);
    formDataToSend.append("websiteUrl", formData.websiteUrl);
    formDataToSend.append("order", formData.order.toString());
    formDataToSend.append("isActive", formData.isActive.toString());
    
    if (logoFile) {
      formDataToSend.append("logo", logoFile);
    } else if (formData.logoUrl) {
      formDataToSend.append("logoUrl", formData.logoUrl);
    }

    if (editingPartner) {
      updateMutation.mutate({ id: editingPartner.id, data: formDataToSend });
    } else {
      createMutation.mutate(formDataToSend);
    }
  };

  const handleEdit = (partner: Partner) => {
    setEditingPartner(partner);
    setFormData({
      name: partner.name,
      logoUrl: partner.logoUrl,
      websiteUrl: partner.websiteUrl || "",
      order: partner.order,
      isActive: partner.isActive,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus partner ini?")) {
      deleteMutation.mutate(id);
    }
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
                <h1 className="text-3xl font-bold text-gray-900">Partner Management</h1>
                <p className="text-muted-foreground">Kelola partner dan sponsor</p>
              </div>
              <Dialog open={isDialogOpen} onOpenChange={(open) => {
                setIsDialogOpen(open);
                if (!open) resetForm();
              }}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Tambah Partner
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>
                      {editingPartner ? "Edit Partner" : "Tambah Partner Baru"}
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="name">Nama Partner</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="logo">Logo Partner</Label>
                      <Input
                        id="logo"
                        type="file"
                        accept="image/*"
                        onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                      />
                      {formData.logoUrl && !logoFile && (
                        <img src={formData.logoUrl} alt="Current logo" className="mt-2 h-20 object-contain" />
                      )}
                    </div>
                    <div>
                      <Label htmlFor="websiteUrl">Website URL (Optional)</Label>
                      <Input
                        id="websiteUrl"
                        type="url"
                        value={formData.websiteUrl}
                        onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
                        placeholder="https://example.com"
                      />
                    </div>
                    <div>
                      <Label htmlFor="order">Urutan Tampilan</Label>
                      <Input
                        id="order"
                        type="number"
                        value={formData.order}
                        onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="isActive"
                        checked={formData.isActive}
                        onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                      />
                      <Label htmlFor="isActive">Aktif</Label>
                    </div>
                    <Button type="submit" className="w-full">
                      {editingPartner ? "Update Partner" : "Tambah Partner"}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Handshake className="h-5 w-5" />
                  Daftar Partner
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <p>Loading...</p>
                ) : partners.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Belum ada partner. Tambahkan partner pertama Anda!
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Logo</TableHead>
                        <TableHead>Nama</TableHead>
                        <TableHead>Website</TableHead>
                        <TableHead>Urutan</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {partners.map((partner) => (
                        <TableRow key={partner.id}>
                          <TableCell>
                            <img src={partner.logoUrl} alt={partner.name} className="h-12 w-12 object-contain" />
                          </TableCell>
                          <TableCell className="font-medium">{partner.name}</TableCell>
                          <TableCell>
                            {partner.websiteUrl ? (
                              <a href={partner.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                Link
                              </a>
                            ) : (
                              "-"
                            )}
                          </TableCell>
                          <TableCell>{partner.order}</TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs ${partner.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
                              {partner.isActive ? "Aktif" : "Nonaktif"}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" onClick={() => handleEdit(partner)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDelete(partner.id)}>
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

