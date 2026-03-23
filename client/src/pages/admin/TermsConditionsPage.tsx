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

// Fixed terms structure with default titles
const FIXED_TERMS = [
  { key: "term1", defaultTitle: "Harga Tiket", order: 1 },
  { key: "term2", defaultTitle: "Jaminan", order: 2 },
  { key: "term3", defaultTitle: "Hadiah", order: 3 },
  { key: "term4", defaultTitle: "Periode", order: 4 },
  { key: "term5", defaultTitle: "Pengumuman Pemenang", order: 5 },
  { key: "term6", defaultTitle: "Informasi Tambahan", order: 6 },
] as const;

export default function TermsConditionsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [formData, setFormData] = useState({
    term1: { title: "", description: "" },
    term2: { title: "", description: "" },
    term3: { title: "", description: "" },
    term4: { title: "", description: "" },
    term5: { title: "", description: "" },
    term6: { title: "", description: "" },
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
      const newFormData: any = {
        term1: { title: "", description: "" },
        term2: { title: "", description: "" },
        term3: { title: "", description: "" },
        term4: { title: "", description: "" },
        term5: { title: "", description: "" },
        term6: { title: "", description: "" },
      };

      // Sort terms by order and map to form fields
      const sortedTerms = [...terms].sort((a, b) => a.order - b.order);

      sortedTerms.forEach((term, index) => {
        if (index < 6) {
          const termKey = `term${index + 1}` as keyof typeof newFormData;
          newFormData[termKey] = {
            title: term.title,
            description: term.description,
          };
        }
      });

      setFormData(newFormData);
    } else {
      // Reset form with default titles if no terms
      setFormData({
        term1: { title: FIXED_TERMS[0].defaultTitle, description: "" },
        term2: { title: FIXED_TERMS[1].defaultTitle, description: "" },
        term3: { title: FIXED_TERMS[2].defaultTitle, description: "" },
        term4: { title: FIXED_TERMS[3].defaultTitle, description: "" },
        term5: { title: FIXED_TERMS[4].defaultTitle, description: "" },
        term6: { title: FIXED_TERMS[5].defaultTitle, description: "" },
      });
    }
  }, [terms]);

  // Mutation to save all terms at once
  const saveMutation = useMutation({
    mutationFn: async () => {
      // First, delete all existing terms for this event
      const deletePromises = terms.map(async (term) => {
        const res = await fetch(`/api/terms/${term.id}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("admin_token")}`,
          },
          credentials: "include",
        });
        if (!res.ok) throw new Error(await res.text());
      });

      await Promise.all(deletePromises);

      // Then create new terms for non-empty fields
      const createPromises = FIXED_TERMS.map(async (fixedTerm) => {
        const termData = formData[fixedTerm.key];
        const title = termData.title.trim() || fixedTerm.defaultTitle;
        const description = termData.description.trim();

        // Skip if description is empty
        if (!description) return null;

        // Create new term
        const res = await fetch(`/api/events/${selectedEventId}/terms`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("admin_token")}`,
          },
          body: JSON.stringify({
            title,
            description,
            order: fixedTerm.order,
            isActive: true,
          }),
          credentials: "include",
        });
        if (!res.ok) throw new Error(await res.text());
        return res.json();
      });

      return Promise.all(createPromises);
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
            { label: "Home", href: "/admin-panel-7x9k/dashboard" },
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
                  {FIXED_TERMS.map((fixedTerm, index) => {
                    const termKey = fixedTerm.key as keyof typeof formData;
                    const termData = formData[termKey];

                    return (
                      <div key={fixedTerm.key} className="p-4 border rounded-lg bg-gray-50">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-600 text-white text-sm font-bold">
                            {index + 1}
                          </span>
                          <h3 className="text-base font-semibold text-gray-700">
                            Kolom {index + 1}
                          </h3>
                        </div>

                        <div className="space-y-3">
                          {/* Title Input */}
                          <div>
                            <Label htmlFor={`${fixedTerm.key}-title`} className="text-sm font-medium">
                              Judul
                            </Label>
                            <input
                              type="text"
                              id={`${fixedTerm.key}-title`}
                              value={termData.title}
                              onChange={(e) => setFormData({
                                ...formData,
                                [termKey]: { ...termData, title: e.target.value }
                              })}
                              placeholder={fixedTerm.defaultTitle}
                              className="mt-1 w-full p-2 border rounded-md bg-white"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              Default: {fixedTerm.defaultTitle}
                            </p>
                          </div>

                          {/* Description Textarea */}
                          <div>
                            <Label htmlFor={`${fixedTerm.key}-description`} className="text-sm font-medium">
                              Deskripsi
                            </Label>
                            <Textarea
                              id={`${fixedTerm.key}-description`}
                              value={termData.description}
                              onChange={(e) => setFormData({
                                ...formData,
                                [termKey]: { ...termData, description: e.target.value }
                              })}
                              placeholder="Tulis deskripsi untuk kolom ini..."
                              rows={3}
                              className="mt-1"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}

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

