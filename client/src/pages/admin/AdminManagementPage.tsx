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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Shield, Plus, Pencil, Trash2, UserCog } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { AdminUser } from "@shared/schema";

export default function AdminManagementPage() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<AdminUser | null>(null);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    name: "",
    role: "viewer",
    allowedIps: "",
    isActive: true,
  });

  const { data: admins = [], isLoading } = useQuery<AdminUser[]>({
    queryKey: ["/api/admin/admins"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("/api/admin/admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/admins"] });
      toast({ title: "Admin berhasil ditambahkan" });
      resetForm();
      setIsDialogOpen(false);
    },
    onError: (error: any) => {
      const errorMessage = error?.message || "Gagal menambahkan admin";
      toast({
        variant: "destructive",
        title: "Gagal menambahkan admin",
        description: errorMessage
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return apiRequest(`/api/admin/admins/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/admins"] });
      toast({ title: "Admin berhasil diupdate" });
      resetForm();
      setIsDialogOpen(false);
    },
    onError: (error: any) => {
      const errorMessage = error?.message || "Gagal mengupdate admin";
      toast({
        variant: "destructive",
        title: "Gagal mengupdate admin",
        description: errorMessage
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest(`/api/admin/admins/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/admins"] });
      toast({ title: "Admin berhasil dihapus" });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Gagal menghapus admin" });
    },
  });

  const resetForm = () => {
    setFormData({
      username: "",
      password: "",
      name: "",
      role: "viewer",
      allowedIps: "",
      isActive: true,
    });
    setEditingAdmin(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const dataToSend = {
      username: formData.username,
      name: formData.name,
      role: formData.role,
      allowedIps: formData.allowedIps,
      isActive: formData.isActive,
      ...(formData.password && { password: formData.password }),
    };

    if (editingAdmin) {
      updateMutation.mutate({ id: editingAdmin.id, data: dataToSend });
    } else {
      if (!formData.password) {
        toast({ variant: "destructive", title: "Password wajib diisi untuk admin baru" });
        return;
      }
      createMutation.mutate(dataToSend);
    }
  };

  const handleEdit = (admin: AdminUser) => {
    setEditingAdmin(admin);
    setFormData({
      username: admin.username,
      password: "",
      name: admin.name || "",
      role: admin.role,
      allowedIps: admin.allowedIps || "",
      isActive: admin.isActive,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus admin ini?")) {
      deleteMutation.mutate(id);
    }
  };

  const getRoleBadge = (role: string) => {
    const badges = {
      superadmin: "bg-red-100 text-red-800",
      qs_custom: "bg-blue-100 text-blue-800",
      viewer: "bg-gray-100 text-gray-800",
    };
    return badges[role as keyof typeof badges] || badges.viewer;
  };

  const getRoleLabel = (role: string) => {
    const labels = {
      superadmin: "Superadmin",
      qs_custom: "QS Custom",
      viewer: "Viewer",
    };
    return labels[role as keyof typeof labels] || role;
  };

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full admin-light">
        <AdminSidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <AdminPageHeader
            title="Admin Management"
            description="Kelola admin dan hak akses"
            icon={UserCog}
          />

          <main className="flex-1 overflow-auto p-6 bg-gray-50">
            <div className="max-w-7xl mx-auto">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      Daftar Admin
                    </CardTitle>
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                      <DialogTrigger asChild>
                        <Button onClick={resetForm}>
                          <Plus className="w-4 h-4 mr-2" />
                          Tambah Admin
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>
                            {editingAdmin ? "Edit Admin" : "Tambah Admin Baru"}
                          </DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                          <div>
                            <Label htmlFor="username">Username</Label>
                            <Input
                              id="username"
                              value={formData.username}
                              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="name">Nama Lengkap</Label>
                            <Input
                              id="name"
                              value={formData.name}
                              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                          </div>
                          <div>
                            <Label htmlFor="password">
                              Password {editingAdmin && "(Kosongkan jika tidak ingin mengubah)"}
                            </Label>
                            <Input
                              id="password"
                              type="password"
                              value={formData.password}
                              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                              required={!editingAdmin}
                            />
                          </div>
                          <div>
                            <Label htmlFor="role">Role</Label>
                            <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="superadmin">Superadmin (Full Access)</SelectItem>
                                <SelectItem value="qs_custom">QS Custom (Peserta & Tiket)</SelectItem>
                                <SelectItem value="viewer">Viewer (Read Only)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="allowedIps">Allowed IPs (comma separated)</Label>
                            <Input
                              id="allowedIps"
                              value={formData.allowedIps}
                              onChange={(e) => setFormData({ ...formData, allowedIps: e.target.value })}
                              placeholder="192.168.1.1, 10.0.0.1"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              Kosongkan untuk mengizinkan semua IP
                            </p>
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
                            {editingAdmin ? "Update Admin" : "Tambah Admin"}
                          </Button>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="text-center py-8 text-gray-500">Loading...</div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Username</TableHead>
                          <TableHead>Nama</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Allowed IPs</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Aksi</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {admins.map((admin) => (
                          <TableRow key={admin.id}>
                            <TableCell className="font-medium">{admin.username}</TableCell>
                            <TableCell>{admin.name || "-"}</TableCell>
                            <TableCell>
                              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getRoleBadge(admin.role)}`}>
                                {getRoleLabel(admin.role)}
                              </span>
                            </TableCell>
                            <TableCell className="text-sm text-gray-600">
                              {admin.allowedIps || "All IPs"}
                            </TableCell>
                            <TableCell>
                              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                admin.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                              }`}>
                                {admin.isActive ? "Aktif" : "Nonaktif"}
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEdit(admin)}
                                >
                                  <Pencil className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDelete(admin.id)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}


