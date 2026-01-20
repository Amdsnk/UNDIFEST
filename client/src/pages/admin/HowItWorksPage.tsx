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
import { Plus, Pencil, Trash2, HelpCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import type { HowItWorks } from "@shared/schema";

export default function HowItWorksPage() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<HowItWorks | null>(null);
  const [formData, setFormData] = useState({
    step: 1,
    title: "",
    description: "",
    iconUrl: "",
    isActive: true,
  });
  const [iconFile, setIconFile] = useState<File | null>(null);

  const { data: items = [], isLoading } = useQuery<HowItWorks[]>({
    queryKey: ["/api/admin/how-it-works"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await fetch("/api/how-it-works", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("admin_token")}`,
        },
        body: data,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Gagal menambahkan step");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/how-it-works"] });
      toast({ title: "Step berhasil ditambahkan" });
      resetForm();
      setIsDialogOpen(false);
    },
    onError: () => {
      toast({ title: "Gagal menambahkan step", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: FormData }) => {
      const response = await fetch(`/api/how-it-works/${id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("admin_token")}`,
        },
        body: data,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Gagal mengupdate step");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/how-it-works"] });
      toast({ title: "Step berhasil diupdate" });
      resetForm();
      setIsDialogOpen(false);
    },
    onError: () => {
      toast({ title: "Gagal mengupdate step", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/how-it-works/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("admin_token")}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Gagal menghapus step");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/how-it-works"] });
      toast({ title: "Step berhasil dihapus" });
    },
    onError: () => {
      toast({ title: "Gagal menghapus step", variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({
      step: 1,
      title: "",
      description: "",
      iconUrl: "",
      isActive: true,
    });
    setIconFile(null);
    setEditingItem(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const formDataToSend = new FormData();
    formDataToSend.append("step", formData.step.toString());
    formDataToSend.append("title", formData.title);
    formDataToSend.append("description", formData.description);
    formDataToSend.append("isActive", formData.isActive.toString());

    if (iconFile) {
      formDataToSend.append("icon", iconFile);
    } else if (formData.iconUrl) {
      formDataToSend.append("iconUrl", formData.iconUrl);
    }

    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data: formDataToSend });
    } else {
      createMutation.mutate(formDataToSend);
    }
  };

  const handleEdit = (item: HowItWorks) => {
    setEditingItem(item);
    setFormData({
      step: item.step,
      title: item.title,
      description: item.description,
      iconUrl: item.iconUrl || "",
      isActive: item.isActive,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus step ini?")) {
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
                <h1 className="text-3xl font-bold text-gray-900">How It Works</h1>
                <p className="text-muted-foreground">Kelola langkah-langkah cara kerja sistem</p>
              </div>
              <Dialog open={isDialogOpen} onOpenChange={(open) => {
                setIsDialogOpen(open);
                if (!open) resetForm();
              }}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Tambah Step
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>
                      {editingItem ? "Edit Step" : "Tambah Step Baru"}
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="step">Nomor Step</Label>
                      <Input
                        id="step"
                        type="number"
                        min="1"
                        value={formData.step}
                        onChange={(e) => setFormData({ ...formData, step: parseInt(e.target.value) || 1 })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="title">Judul</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="description">Deskripsi</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        rows={4}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="icon">Icon (Optional)</Label>
                      <Input
                        id="icon"
                        type="file"
                        accept="image/*"
                        onChange={(e) => setIconFile(e.target.files?.[0] || null)}
                      />
                      {formData.iconUrl && !iconFile && (
                        <img src={formData.iconUrl} alt="Current icon" className="mt-2 h-16 object-contain" />
                      )}
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
                      {editingItem ? "Update Step" : "Tambah Step"}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HelpCircle className="h-5 w-5" />
                  Daftar Langkah
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <p>Loading...</p>
                ) : items.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Belum ada step. Tambahkan step pertama Anda!
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Step</TableHead>
                        <TableHead>Icon</TableHead>
                        <TableHead>Judul</TableHead>
                        <TableHead>Deskripsi</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.sort((a, b) => a.step - b.step).map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.step}</TableCell>
                          <TableCell>
                            {item.iconUrl && (
                              <img src={item.iconUrl} alt={item.title} className="h-10 w-10 object-contain" />
                            )}
                          </TableCell>
                          <TableCell className="font-medium">{item.title}</TableCell>
                          <TableCell className="max-w-md truncate">{item.description}</TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs ${item.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
                              {item.isActive ? "Aktif" : "Nonaktif"}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" onClick={() => handleEdit(item)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDelete(item.id)}>
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

