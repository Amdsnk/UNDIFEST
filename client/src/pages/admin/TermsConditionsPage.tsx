import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import type { Event, TermsCondition } from "@shared/schema";
import { AdminSidebar } from "@/components/AdminSidebar";
import { AdminPageHeader } from "@/components/AdminPageHeader";
import { SidebarProvider } from "@/components/ui/sidebar";

// Fixed terms structure
const FIXED_TERMS = [
  { key: "hargaTiket", title: "Harga Tiket", order: 1 },
  { key: "jaminan", title: "Jaminan", order: 2 },
  { key: "hadiah", title: "Hadiah", order: 3 },
  { key: "periode", title: "Periode", order: 4 },
  { key: "pengumumanPemenang", title: "Pengumuman Pemenang", order: 5 },
  { key: "informasiTambahan", title: "Informasi Tambahan", order: 6 },
] as const;

export default function TermsConditionsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [formData, setFormData] = useState({
    hargaTiket: "",
    jaminan: "",
    hadiah: "",
    periode: "",
    pengumumanPemenang: "",
    informasiTambahan: "",
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

  // Load existing terms into form when event is selected
  useEffect(() => {
    if (terms.length > 0) {
      const termsMap: any = {
        hargaTiket: "",
        jaminan: "",
        hadiah: "",
        periode: "",
        pengumumanPemenang: "",
        informasiTambahan: "",
      };

      terms.forEach((term) => {
        const fixedTerm = FIXED_TERMS.find((ft) => ft.title === term.title);
        if (fixedTerm) {
          termsMap[fixedTerm.key] = term.description;
        }
      });

      setFormData(termsMap);
    } else {
      // Reset form if no terms
      setFormData({
        hargaTiket: "",
        jaminan: "",
        hadiah: "",
        periode: "",
        pengumumanPemenang: "",
        informasiTambahan: "",
      });
    }
  }, [terms]);

  // Mutation to save all terms at once
  const saveMutation = useMutation({
    mutationFn: async () => {
      const promises = FIXED_TERMS.map(async (fixedTerm) => {
        const description = formData[fixedTerm.key];

        // Find existing term with this title
        const existingTerm = terms.find((t) => t.title === fixedTerm.title);

        // If description is empty
        if (!description.trim()) {
          // Delete existing term if it exists
          if (existingTerm) {
            const res = await fetch(`/api/terms/${existingTerm.id}`, {
              method: "DELETE",
              headers: {
                Authorization: `Bearer ${localStorage.getItem("admin_token")}`,
              },
              credentials: "include",
            });
            if (!res.ok) throw new Error(await res.text());
          }
          return null;
        }

        if (existingTerm) {
          // Update existing term
          const res = await fetch(`/api/terms/${existingTerm.id}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("admin_token")}`,
            },
            body: JSON.stringify({
              title: fixedTerm.title,
              description,
              order: fixedTerm.order,
              isActive: true,
            }),
            credentials: "include",
          });
          if (!res.ok) throw new Error(await res.text());
          return res.json();
        } else {
          // Create new term
          const res = await fetch(`/api/events/${selectedEventId}/terms`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("admin_token")}`,
            },
            body: JSON.stringify({
              title: fixedTerm.title,
              description,
              order: fixedTerm.order,
              isActive: true,
            }),
            credentials: "include",
          });
          if (!res.ok) throw new Error(await res.text());
          return res.json();
        }
      });

      return Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/events/${selectedEventId}/terms`] });
      toast({ title: "Berhasil menyimpan S&K" });
    },
    onError: () => {
      toast({ title: "Gagal menyimpan S&K", variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEventId) {
      toast({ title: "Pilih event terlebih dahulu", variant: "destructive" });
      return;
    }

    saveMutation.mutate();
  };

  return (
    <SidebarProvider>
      <AdminSidebar />
      <div className="flex flex-col flex-1 min-h-screen admin-light bg-gray-50">
        <AdminPageHeader
          title="Syarat & Ketentuan"
          description="Kelola syarat dan ketentuan untuk setiap event"
          breadcrumbs={[
            { label: "Home", href: "/admin/dashboard" },
            { label: "Syarat & Ketentuan" }
          ]}
        />

        <div className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto space-y-6">
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
          {/* Fixed Form for S&K */}
          <Card>
            <CardHeader>
              <CardTitle>Syarat & Ketentuan Event</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p className="text-gray-500">Memuat data...</p>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Harga Tiket */}
                  <div>
                    <Label htmlFor="hargaTiket" className="text-base font-semibold">
                      Harga Tiket
                    </Label>
                    <Textarea
                      id="hargaTiket"
                      value={formData.hargaTiket}
                      onChange={(e) => setFormData({ ...formData, hargaTiket: e.target.value })}
                      placeholder="Contoh: Beli e-book senilai Rp 10.000 untuk mendapatkan 1 tiket undian."
                      rows={3}
                      className="mt-2"
                    />
                  </div>

                  {/* Jaminan */}
                  <div>
                    <Label htmlFor="jaminan" className="text-base font-semibold">
                      Jaminan
                    </Label>
                    <Textarea
                      id="jaminan"
                      value={formData.jaminan}
                      onChange={(e) => setFormData({ ...formData, jaminan: e.target.value })}
                      placeholder="Contoh: Jaminan uang kembali Rp 10.000."
                      rows={3}
                      className="mt-2"
                    />
                  </div>

                  {/* Hadiah */}
                  <div>
                    <Label htmlFor="hadiah" className="text-base font-semibold">
                      Hadiah
                    </Label>
                    <Textarea
                      id="hadiah"
                      value={formData.hadiah}
                      onChange={(e) => setFormData({ ...formData, hadiah: e.target.value })}
                      placeholder="Contoh: Hadiah utama senilai Rp 1.000.000"
                      rows={3}
                      className="mt-2"
                    />
                  </div>

                  {/* Periode */}
                  <div>
                    <Label htmlFor="periode" className="text-base font-semibold">
                      Periode
                    </Label>
                    <Textarea
                      id="periode"
                      value={formData.periode}
                      onChange={(e) => setFormData({ ...formData, periode: e.target.value })}
                      placeholder="Contoh: 21 Februari 2025 - 11 Maret 2025"
                      rows={3}
                      className="mt-2"
                    />
                  </div>

                  {/* Pengumuman Pemenang */}
                  <div>
                    <Label htmlFor="pengumumanPemenang" className="text-base font-semibold">
                      Pengumuman Pemenang
                    </Label>
                    <Textarea
                      id="pengumumanPemenang"
                      value={formData.pengumumanPemenang}
                      onChange={(e) => setFormData({ ...formData, pengumumanPemenang: e.target.value })}
                      placeholder="Contoh: 11 Maret 2025 pukul 19.00 WIB melalui seluruh channel resmi kami."
                      rows={3}
                      className="mt-2"
                    />
                  </div>

                  {/* Informasi Tambahan */}
                  <div>
                    <Label htmlFor="informasiTambahan" className="text-base font-semibold">
                      Informasi Tambahan
                    </Label>
                    <Textarea
                      id="informasiTambahan"
                      value={formData.informasiTambahan}
                      onChange={(e) => setFormData({ ...formData, informasiTambahan: e.target.value })}
                      placeholder="Informasi tambahan lainnya (opsional)"
                      rows={3}
                      className="mt-2"
                    />
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button type="submit" disabled={saveMutation.isPending} className="px-8">
                      {saveMutation.isPending ? "Menyimpan..." : "Simpan S&K"}
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </>
      )}
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
}

