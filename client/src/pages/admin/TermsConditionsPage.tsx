import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, GripVertical } from "lucide-react";
import type { Event, TermsCondition } from "@shared/schema";

export default function TermsConditionsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    order: 0,
    isActive: true,
  });

  // Fetch all events
  const { data: events = [] } = useQuery<Event[]>({
    queryKey: ["/api/events"],
  });

  // Fetch terms for selected event
  const { data: terms = [], isLoading } = useQuery<TermsCondition[]>({
    queryKey: [`/api/admin/events/${selectedEventId}/terms`],
    enabled: !!selectedEventId,
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await fetch(`/api/events/${selectedEventId}/terms`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("admin_token")}`,
        },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/events/${selectedEventId}/terms`] });
      resetForm();
      toast({ title: "Berhasil menambahkan S&K" });
    },
    onError: () => {
      toast({ title: "Gagal menambahkan S&K", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const res = await fetch(`/api/terms/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("admin_token")}`,
        },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/events/${selectedEventId}/terms`] });
      resetForm();
      toast({ title: "Berhasil mengupdate S&K" });
    },
    onError: () => {
      toast({ title: "Gagal mengupdate S&K", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/terms/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("admin_token")}`,
        },
        credentials: "include",
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/events/${selectedEventId}/terms`] });
      toast({ title: "Berhasil menghapus S&K" });
    },
    onError: () => {
      toast({ title: "Gagal menghapus S&K", variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({ title: "", description: "", order: 0, isActive: true });
    setEditingId(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEventId) {
      toast({ title: "Pilih event terlebih dahulu", variant: "destructive" });
      return;
    }

    if (editingId) {
      updateMutation.mutate({ id: editingId, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (term: TermsCondition) => {
    setFormData({
      title: term.title,
      description: term.description,
      order: term.order,
      isActive: term.isActive,
    });
    setEditingId(term.id);
  };

  const handleDelete = (id: string) => {
    if (confirm("Yakin ingin menghapus S&K ini?")) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Kelola Syarat & Ketentuan</h1>

      {/* Event Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Pilih Event</CardTitle>
        </CardHeader>
        <CardContent>
          <select
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            className="w-full p-2 border rounded-md bg-background"
          >
            <option value="">-- Pilih Event --</option>
            {events.map((event) => (
              <option key={event.id} value={event.id}>
                {event.name}
              </option>
            ))}
          </select>
        </CardContent>
      </Card>

      {selectedEventId && (
        <>
          {/* Form Add/Edit */}
          <Card>
            <CardHeader>
              <CardTitle>{editingId ? "Edit S&K" : "Tambah S&K Baru"}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="title">Judul S&K</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Contoh: Harga Tiket"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description">Deskripsi</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Tulis deskripsi S&K..."
                    rows={4}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="order">Urutan</Label>
                  <Input
                    id="order"
                    type="number"
                    value={formData.order}
                    onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) })}
                    min={0}
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

                <div className="flex gap-2">
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                    <Plus className="w-4 h-4 mr-2" />
                    {editingId ? "Update" : "Tambah"}
                  </Button>
                  {editingId && (
                    <Button type="button" variant="outline" onClick={resetForm}>
                      Batal
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>

          {/* List of Terms */}
          <Card>
            <CardHeader>
              <CardTitle>Daftar S&K</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p>Loading...</p>
              ) : terms.length === 0 ? (
                <p className="text-muted-foreground">Belum ada S&K untuk event ini.</p>
              ) : (
                <div className="space-y-3">
                  {terms.map((term) => (
                    <div
                      key={term.id}
                      className="flex items-start gap-3 p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <GripVertical className="w-5 h-5 text-muted-foreground mt-1 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{term.title}</h3>
                          {!term.isActive && (
                            <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded">
                              Nonaktif
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{term.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">Urutan: {term.order}</p>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <Button size="sm" variant="outline" onClick={() => handleEdit(term)}>
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(term.id)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

