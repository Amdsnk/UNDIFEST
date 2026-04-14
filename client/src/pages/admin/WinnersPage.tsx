import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminSidebar } from "@/components/AdminSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Trophy, Users, RefreshCw, Sparkles, Plus, Pencil, Trash2, Upload, Download, FileSpreadsheet, FileText as FileTextIcon } from "lucide-react";
import { useState, useRef } from "react";
import type { Event, Transaction, Winner, User, ManualWinnerHistory } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocation } from "wouter";
import * as XLSX from "xlsx";

export default function WinnersPage() {
  const [selectedEventId, setSelectedEventId] = useState<string>("__all__");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedWinner, setSelectedWinner] = useState<Transaction | null>(null);
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [bulkFilters, setBulkFilters] = useState({
    count: 10,
    keyword: "",
    city: "",
    prioritizeTickets: true,
  });
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const { data: events } = useQuery<Event[]>({
    queryKey: ["/api/admin/events"],
  });

  const { data: transactions } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
  });

  const { data: winners, refetch: refetchWinners } = useQuery<Winner[]>({
    queryKey: ["/api/winners"],
    refetchInterval: 30000, // Auto-refetch every 30 seconds
  });

  const { data: users } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  // ── Manual Winner History ───────────────────────────────────────────────────
  const [manualDialogOpen, setManualDialogOpen] = useState(false);
  const [editingManual, setEditingManual] = useState<ManualWinnerHistory | null>(null);
  const [clearAllDialogOpen, setClearAllDialogOpen] = useState(false);

  // ── Upload Excel/TXT ───────────────────────────────────────────────────────
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadPreview, setUploadPreview] = useState<any[]>([]);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadFileName, setUploadFileName] = useState("");
  const [manualForm, setManualForm] = useState({
    winDate: "", phoneNumber: "", displayName: "", amount: "", eventName: "",
  });

  const { data: manualHistory, refetch: refetchManual } = useQuery<ManualWinnerHistory[]>({
    queryKey: ["/api/manual-winner-history"],
  });

  const createManualMutation = useMutation({
    mutationFn: (data: typeof manualForm) =>
      apiRequest("/api/manual-winner-history", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/manual-winner-history"] }); setManualDialogOpen(false); toast({ title: "Entri ditambahkan" }); },
    onError: (e: Error) => toast({ variant: "destructive", title: "Gagal", description: e.message }),
  });

  const updateManualMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<typeof manualForm> }) =>
      apiRequest(`/api/manual-winner-history/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/manual-winner-history"] }); setManualDialogOpen(false); setEditingManual(null); toast({ title: "Entri diperbarui" }); },
    onError: (e: Error) => toast({ variant: "destructive", title: "Gagal", description: e.message }),
  });

  const deleteManualMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest(`/api/manual-winner-history/${id}`, { method: "DELETE" }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/manual-winner-history"] }); toast({ title: "Entri dihapus" }); },
    onError: (e: Error) => toast({ variant: "destructive", title: "Gagal", description: e.message }),
  });

  const clearAllManualMutation = useMutation({
    mutationFn: () => apiRequest("/api/manual-winner-history", { method: "DELETE" }),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/manual-winner-history"] });
      setClearAllDialogOpen(false);
      toast({ title: `Semua entri dihapus (${res?.deleted ?? 0} data)` });
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Gagal hapus semua", description: e.message }),
  });

  const bulkCreateMutation = useMutation({
    mutationFn: (entries: any[]) =>
      apiRequest("/api/manual-winner-history/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entries }),
      }),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/manual-winner-history"] });
      setUploadDialogOpen(false);
      setUploadPreview([]);
      toast({ title: `✅ ${res?.inserted ?? 0} entri berhasil disimpan dari file` });
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Gagal upload", description: e.message }),
  });

  /** Normalise a date value from Excel (serial number or string) to ISO string */
  const parseDate = (raw: any): string => {
    if (!raw) return new Date().toISOString().slice(0, 10);
    if (typeof raw === "number") {
      // Excel serial date
      const date = XLSX.SSF.parse_date_code(raw);
      const d = new Date(date.y, date.m - 1, date.d);
      return d.toISOString().slice(0, 10);
    }
    const str = String(raw).trim();
    // Try DD/MM/YYYY or DD-MM-YYYY
    const parts = str.split(/[\/\-\.]/);
    if (parts.length === 3 && parts[0].length <= 2 && parts[2].length === 4) {
      return `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
    }
    // Fallback: parse as-is
    const d = new Date(str);
    return isNaN(d.getTime()) ? new Date().toISOString().slice(0, 10) : d.toISOString().slice(0, 10);
  };

  /** Map a raw row (from Excel or TXT) to preview object.
   *  Supports format: Hari | Tanggal | no hp | Hadiah | Event
   *  "Hari" column is ignored (day-of-week label). */
  const mapRow = (row: any, idx: number) => {
    // Phone: support "no hp", "no_hp", "No HP", "No. Telepon", etc.
    const phone = String(
      row["no hp"] ?? row["No HP"] ?? row["no_hp"] ?? row["No. Telepon"] ??
      row["No Telepon"] ?? row["Nomor Telepon"] ?? row["nomor_telepon"] ?? row["phone"] ?? ""
    ).trim();

    // Tanggal: may be at named key, or positional.
    // When format has "Hari" column, "Tanggal" is at index 1; "no hp" at index 2, etc.
    const tanggal = row["Tanggal"] ?? row["tanggal"] ?? row["date"] ?? "";

    const amount = String(row["Hadiah"] ?? row["hadiah"] ?? row["Amount"] ?? "").trim();
    const eventName = String(row["Event"] ?? row["event"] ?? row["Nama Event"] ?? "").trim();
    const displayName = String(row["Nama"] ?? row["nama"] ?? row["displayName"] ?? "").trim() || undefined;

    return {
      winDate: parseDate(tanggal),
      phoneNumber: phone,
      amount,
      eventName,
      displayName,
      displayOrder: idx,
    };
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadFileName(file.name);
    const ext = file.name.split(".").pop()?.toLowerCase();

    try {
      if (ext === "txt" || ext === "csv") {
        const text = await file.text();
        const lines = text.split(/\r?\n/).filter(l => l.trim());
        // Detect separator: tab, pipe, comma, semicolon
        const sep = lines[0].includes("\t") ? "\t" : lines[0].includes("|") ? "|" : lines[0].includes(";") ? ";" : ",";
        const headers = lines[0].split(sep).map(h => h.trim());
        // First row is header if first cell is not a number (e.g. "Hari", "Senin" both qualify)
        // but "Senin" (day name) in data row would also pass. Detect header by looking for
        // known column keywords.
        const headerKeywords = ["hari", "tanggal", "no", "hp", "hadiah", "event", "telepon", "phone", "date"];
        const isHeader = headers.some(h => headerKeywords.some(k => h.toLowerCase().includes(k)));
        const dataLines = isHeader ? lines.slice(1) : lines;
        const rows = dataLines.map((l, i) => {
          const cols = l.split(sep).map(c => c.trim());
          const obj: any = {};
          if (isHeader) {
            // Store both by header name AND by position index for fallback
            headers.forEach((h, j) => {
              obj[h] = cols[j] ?? "";
              obj[j] = cols[j] ?? "";
            });
          } else {
            cols.forEach((c, j) => { obj[j] = c; });
          }
          return mapRow(obj, i);
        }).filter(r => r.phoneNumber && r.eventName);
        setUploadPreview(rows);
      } else {
        const buf = await file.arrayBuffer();
        const wb = XLSX.read(buf, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const raw: any[] = XLSX.utils.sheet_to_json(ws, { defval: "" });
        const rows = raw.map((r, i) => mapRow(r, i)).filter(r => r.phoneNumber && r.eventName);
        setUploadPreview(rows);
      }
      setUploadDialogOpen(true);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Gagal membaca file", description: err.message });
    }
    // Reset input so same file can be re-uploaded
    e.target.value = "";
  };

  const downloadTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      ["Tanggal", "No. Telepon", "Hadiah", "Event", "Nama"],
      ["01/12/2025", "08123456789", "100.000", "E-BOOK : Jadilah Miliarder", "Budi Santoso"],
      ["15/01/2026", "08567891234", "50.000", "Undian Spesial Lebaran", ""],
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "template-riwayat-pemenang.xlsx");
  };

  const openAddManual = () => {
    setEditingManual(null);
    setManualForm({ winDate: new Date().toISOString().slice(0, 10), phoneNumber: "", displayName: "", amount: "", eventName: "" });
    setManualDialogOpen(true);
  };

  const openEditManual = (entry: ManualWinnerHistory) => {
    setEditingManual(entry);
    setManualForm({
      winDate: new Date(entry.winDate).toISOString().slice(0, 10),
      phoneNumber: entry.phoneNumber,
      displayName: entry.displayName || "",
      amount: String(entry.amount),
      eventName: entry.eventName,
    });
    setManualDialogOpen(true);
  };

  const submitManualForm = () => {
    if (editingManual) {
      updateManualMutation.mutate({ id: editingManual.id, data: manualForm });
    } else {
      createManualMutation.mutate(manualForm);
    }
  };

  const activeEvents = events?.filter(e => e.status === "aktif" || e.status === "selesai") || [];

  const eventTransactions = selectedEventId !== "__all__"
    ? transactions?.filter(t => t.eventId === selectedEventId) || []
    : transactions || [];

  const eventWinners = selectedEventId !== "__all__"
    ? winners?.filter(w => w.eventId === selectedEventId) || []
    : winners || [];

  const drawWinnerMutation = useMutation({
    mutationFn: async (eventId: string) => {
      return apiRequest("/api/winners/draw", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ eventId }),
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/winners"] });
      setSelectedWinner(data.transaction);
      setDialogOpen(true);
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Gagal Mengundi Pemenang",
        description: error.message,
      });
    },
  });

  const bulkGenerateMutation = useMutation({
    mutationFn: async (data: { eventId: string; count: number; filters: any }) => {
      return apiRequest("/api/winners/bulk-generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/winners"] });
      toast({
        title: "Bulk Generation Berhasil!",
        description: `${data.count} pemenang berhasil di-generate`,
      });
      setBulkDialogOpen(false);
      setBulkFilters({
        count: 10,
        keyword: "",
        city: "",
        prioritizeTickets: true,
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Gagal Generate Pemenang",
        description: error.message,
      });
    },
  });

  const drawRandomWinner = () => {
    if (!selectedEventId) return;
    drawWinnerMutation.mutate(selectedEventId);
  };

  const handleBulkGenerate = () => {
    if (!selectedEventId || selectedEventId === "__all__") {
      toast({
        variant: "destructive",
        title: "Pilih Event",
        description: "Silakan pilih event terlebih dahulu",
      });
      return;
    }

    bulkGenerateMutation.mutate({
      eventId: selectedEventId,
      count: bulkFilters.count,
      filters: {
        keyword: bulkFilters.keyword,
        city: bulkFilters.city,
        prioritizeTickets: bulkFilters.prioritizeTickets,
      },
    });
  };

  const confirmAnnouncement = () => {
    toast({
      title: "Pemenang Diumumkan",
      description: "Pemenang berhasil ditambahkan",
    });
    setDialogOpen(false);
    setSelectedWinner(null);
  };

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full admin-light">
        <AdminSidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg">
            <div className="flex items-center gap-4">
              <SidebarTrigger data-testid="button-sidebar-toggle" className="text-white hover:bg-white/20" />
              <div>
                <h1 className="text-3xl font-bold flex items-center gap-2">
                  <Trophy className="w-8 h-8" />
                  Nominasi Winner
                </h1>
                <p className="text-purple-100 text-sm mt-1">Kelola dan pilih pemenang undian event</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetchWinners()}
              className="flex items-center gap-2 bg-white/10 border-white/30 text-white hover:bg-white/20 hover:border-white/50 transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh Data
            </Button>
          </header>

          <main className="flex-1 overflow-auto p-6 bg-gradient-to-br from-gray-50 via-purple-50/30 to-blue-50/30">
            <div className="max-w-7xl mx-auto space-y-6">
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
                <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Cara Memilih Pemenang
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                    <div className="flex items-start gap-3">
                      <div className="bg-white/20 rounded-full p-2">
                        <Trophy className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-semibold mb-1">Undi Pemenang Acak</h4>
                        <p className="text-sm text-purple-100">Sistem akan memilih pemenang secara random dari semua peserta yang belum menang</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                    <div className="flex items-start gap-3">
                      <div className="bg-white/20 rounded-full p-2">
                        <Users className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-semibold mb-1">Lihat Daftar Peserta</h4>
                        <p className="text-sm text-purple-100">Pilih pemenang secara manual dari daftar peserta event</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <Card className="bg-white shadow-md border-0">
                <div className="p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        🎯 Filter Event
                      </label>
                      <Select value={selectedEventId} onValueChange={setSelectedEventId}>
                        <SelectTrigger data-testid="select-event" className="w-full h-12 border-2 border-gray-200 hover:border-purple-300 focus:border-purple-500 transition-colors">
                          <SelectValue placeholder="Semua Event" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__all__">
                            <span className="font-medium">📊 Semua Event</span>
                          </SelectItem>
                          {activeEvents.map((event) => (
                            <SelectItem key={event.id} value={event.id}>
                              <span className="font-medium">🎪 {event.name}</span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {selectedEventId !== "__all__" && (
                      <div className="flex items-end gap-3">
                        <Button
                          onClick={drawRandomWinner}
                          data-testid="button-draw-winner"
                          className="flex-1 h-12 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all"
                          disabled={eventTransactions.length === 0 || drawWinnerMutation.isPending}
                        >
                          <Trophy className="w-5 h-5 mr-2" />
                          {drawWinnerMutation.isPending ? "Mengundi..." : "Undi Acak"}
                        </Button>
                        <Dialog open={bulkDialogOpen} onOpenChange={setBulkDialogOpen}>
                          <DialogTrigger asChild>
                            <Button
                              className="flex-1 h-12 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all"
                              disabled={eventTransactions.length === 0}
                            >
                              <Sparkles className="w-5 h-5 mr-2" />
                              Generate 10 Pemenang
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-md">
                            <DialogHeader>
                              <DialogTitle>Generate Pemenang Otomatis</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <div>
                                <Label htmlFor="count">Jumlah Pemenang</Label>
                                <Input
                                  id="count"
                                  type="number"
                                  min="1"
                                  max="100"
                                  value={bulkFilters.count}
                                  onChange={(e) => setBulkFilters({ ...bulkFilters, count: parseInt(e.target.value) || 10 })}
                                />
                              </div>
                              <div>
                                <Label htmlFor="keyword">Filter Kata Kunci (Nama/Telepon)</Label>
                                <Input
                                  id="keyword"
                                  placeholder="Cari nama atau nomor telepon..."
                                  value={bulkFilters.keyword}
                                  onChange={(e) => setBulkFilters({ ...bulkFilters, keyword: e.target.value })}
                                />
                              </div>
                              <div>
                                <Label htmlFor="city">Filter Kota</Label>
                                <Input
                                  id="city"
                                  placeholder="Nama kota..."
                                  value={bulkFilters.city}
                                  onChange={(e) => setBulkFilters({ ...bulkFilters, city: e.target.value })}
                                />
                              </div>
                              <div className="flex items-center space-x-2">
                                <Switch
                                  id="prioritize"
                                  checked={bulkFilters.prioritizeTickets}
                                  onCheckedChange={(checked) => setBulkFilters({ ...bulkFilters, prioritizeTickets: checked })}
                                />
                                <Label htmlFor="prioritize">
                                  Prioritaskan yang banyak beli tiket & sering ikut
                                </Label>
                              </div>
                              <Button
                                onClick={handleBulkGenerate}
                                className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700"
                                disabled={bulkGenerateMutation.isPending}
                              >
                                {bulkGenerateMutation.isPending ? "Generating..." : "Generate Pemenang"}
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                        <Button
                          onClick={() => navigate(`/admin/events/${selectedEventId}/participants`)}
                          data-testid="button-view-participants"
                          className="flex-1 h-12 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all"
                        >
                          <Users className="w-5 h-5 mr-2" />
                          Daftar Peserta
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-lg hover:shadow-xl transition-shadow">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="bg-white/20 rounded-full p-3">
                        <Users className="w-6 h-6" />
                      </div>
                      <div className="text-right">
                        <p className="text-blue-100 text-sm font-medium">
                          {selectedEventId !== "__all__" ? "Total Peserta Event" : "Total Peserta"}
                        </p>
                        <p className="text-4xl font-bold mt-1">{eventTransactions.length}</p>
                      </div>
                    </div>
                    <div className="h-1 bg-white/20 rounded-full overflow-hidden">
                      <div className="h-full bg-white/40 rounded-full" style={{ width: '100%' }}></div>
                    </div>
                  </div>
                </Card>

                <Card className="bg-gradient-to-br from-green-500 to-emerald-600 text-white border-0 shadow-lg hover:shadow-xl transition-shadow">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="bg-white/20 rounded-full p-3">
                        <Trophy className="w-6 h-6" />
                      </div>
                      <div className="text-right">
                        <p className="text-green-100 text-sm font-medium">
                          {selectedEventId !== "__all__" ? "Pemenang Event" : "Total Pemenang"}
                        </p>
                        <p className="text-4xl font-bold mt-1">{eventWinners.length}</p>
                      </div>
                    </div>
                    <div className="h-1 bg-white/20 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-white/40 rounded-full transition-all"
                        style={{ width: eventTransactions.length > 0 ? `${(eventWinners.length / eventTransactions.length) * 100}%` : '0%' }}
                      ></div>
                    </div>
                  </div>
                </Card>

                <Card className="bg-gradient-to-br from-purple-500 to-pink-600 text-white border-0 shadow-lg hover:shadow-xl transition-shadow">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="bg-white/20 rounded-full p-3">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                      <div className="text-right">
                        <p className="text-purple-100 text-sm font-medium">
                          {selectedEventId !== "__all__" ? "Sisa Peserta" : "Belum Menang"}
                        </p>
                        <p className="text-4xl font-bold mt-1">
                          {eventTransactions.length - eventWinners.length}
                        </p>
                      </div>
                    </div>
                    <div className="h-1 bg-white/20 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-white/40 rounded-full transition-all"
                        style={{ width: eventTransactions.length > 0 ? `${((eventTransactions.length - eventWinners.length) / eventTransactions.length) * 100}%` : '0%' }}
                      ></div>
                    </div>
                  </div>
                </Card>
              </div>

              {eventWinners.length > 0 && (
                <Card className="bg-white rounded-xl border-0 shadow-lg overflow-hidden">
                  <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6 text-white">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                      <Trophy className="w-6 h-6" />
                      Daftar Pemenang {selectedEventId !== "__all__" ? `- ${events?.find(e => e.id === selectedEventId)?.name}` : '(Semua Event)'}
                    </h3>
                    <p className="text-purple-100 text-sm mt-1">
                      Total {eventWinners.length} pemenang terpilih
                    </p>
                  </div>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50 hover:bg-gray-50">
                          <TableHead className="font-bold text-gray-700">No</TableHead>
                          <TableHead className="font-bold text-gray-700">Nama</TableHead>
                          <TableHead className="font-bold text-gray-700">Nomor Telepon</TableHead>
                          <TableHead className="font-bold text-gray-700">Event</TableHead>
                          <TableHead className="font-bold text-gray-700">Tanggal Diumumkan</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {eventWinners.map((winner, index) => {
                          const event = events?.find(e => e.id === winner.eventId);
                          // Use displayName/displayPhone from API (supports both account & guest winners)
                          const displayName = (winner as any).displayName || "-";
                          const displayPhone = (winner as any).displayPhone || "-";
                          return (
                            <TableRow
                              key={winner.id}
                              data-testid={`row-winner-${winner.id}`}
                              className="hover:bg-purple-50 transition-colors"
                            >
                              <TableCell className="font-semibold">
                                {index + 1}
                              </TableCell>
                              <TableCell className="font-semibold text-gray-900">
                                {displayName}
                              </TableCell>
                              <TableCell className="text-gray-700">
                                <span className="font-mono bg-gray-100 px-3 py-1 rounded-full text-sm">
                                  {displayPhone}
                                </span>
                              </TableCell>
                              <TableCell>
                                <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                                  {event?.name || "-"}
                                </span>
                              </TableCell>
                              <TableCell className="text-gray-600">
                                <div className="flex flex-col">
                                  <span className="font-medium">
                                    {new Date(winner.announcedAt).toLocaleDateString('id-ID', {
                                      day: 'numeric',
                                      month: 'short',
                                      year: 'numeric'
                                    })}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {new Date(winner.announcedAt).toLocaleTimeString('id-ID', {
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </span>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </Card>
              )}

              {eventWinners.length === 0 && (
                <Card className="bg-white rounded-xl border-0 shadow-lg p-12">
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-purple-100 to-blue-100 mb-6">
                      <Trophy className="w-12 h-12 text-purple-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800 mb-2">Belum Ada Pemenang</h3>
                    <p className="text-gray-600 max-w-md mx-auto">
                      {selectedEventId !== "__all__"
                        ? "Belum ada pemenang untuk event ini. Gunakan tombol di atas untuk memilih pemenang secara acak atau manual."
                        : "Belum ada pemenang yang dinominasikan. Pilih event terlebih dahulu, lalu nominasikan pemenang."}
                    </p>
                    {selectedEventId !== "__all__" && (
                      <div className="mt-6 flex gap-3 justify-center">
                        <Button
                          onClick={drawRandomWinner}
                          className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold shadow-lg"
                          disabled={eventTransactions.length === 0 || drawWinnerMutation.isPending}
                        >
                          <Trophy className="w-4 h-4 mr-2" />
                          Undi Pemenang Acak
                        </Button>
                        <Button
                          onClick={() => navigate(`/admin/events/${selectedEventId}/participants`)}
                          className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold shadow-lg"
                        >
                          <Users className="w-4 h-4 mr-2" />
                          Lihat Daftar Peserta
                        </Button>
                      </div>
                    )}
                  </div>
                </Card>
              )}
            </div>

            {/* ── Manual Riwayat Pemenang Section ────────────────────────────── */}
            <div className="mt-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-yellow-500" />
                    Riwayat Pemenang Manual (Halaman /history)
                  </CardTitle>
                  <div className="flex items-center gap-2 flex-wrap justify-end">
                    <Button onClick={downloadTemplate} size="sm" variant="outline" className="text-gray-600">
                      <Download className="w-4 h-4 mr-1" /> Template
                    </Button>
                    <Button onClick={() => fileInputRef.current?.click()} size="sm" className="bg-blue-600 hover:bg-blue-700">
                      <Upload className="w-4 h-4 mr-1" /> Upload Excel/TXT
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".xlsx,.xls,.csv,.txt"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                    {manualHistory && manualHistory.length > 0 && (
                      <Button onClick={() => setClearAllDialogOpen(true)} size="sm" variant="destructive">
                        <Trash2 className="w-4 h-4 mr-1" /> Hapus Semua
                      </Button>
                    )}
                    <Button onClick={openAddManual} size="sm" className="bg-green-600 hover:bg-green-700">
                      <Plus className="w-4 h-4 mr-1" /> Tambah Entri
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-500 mb-3">Data di bawah ini ditampilkan di halaman publik Riwayat Pemenang. Admin mengelola entri secara manual.</p>
                  {!manualHistory || manualHistory.length === 0 ? (
                    <div className="text-center text-gray-400 py-8">Belum ada entri. Klik "Tambah Entri" untuk menambah data.</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Tanggal</TableHead>
                            <TableHead>No. Telepon</TableHead>
                            <TableHead>Hadiah</TableHead>
                            <TableHead>Event</TableHead>
                            <TableHead>Aksi</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {manualHistory.map(entry => (
                            <TableRow key={entry.id}>
                              <TableCell>{new Date(entry.winDate).toLocaleDateString("id-ID")}</TableCell>
                              <TableCell>{entry.phoneNumber}</TableCell>
                              <TableCell>{entry.amount}</TableCell>
                              <TableCell>{entry.eventName}</TableCell>
                              <TableCell>
                                <div className="flex gap-1">
                                  <Button size="sm" variant="outline" onClick={() => openEditManual(entry)}><Pencil className="w-3 h-3" /></Button>
                                  <Button size="sm" variant="destructive" onClick={() => deleteManualMutation.mutate(entry.id)}><Trash2 className="w-3 h-3" /></Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>

      {/* ── Manual Winner History Dialog ─────────────────────────────────── */}
      <Dialog open={manualDialogOpen} onOpenChange={setManualDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingManual ? "Edit Entri Riwayat Pemenang" : "Tambah Entri Riwayat Pemenang"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <div>
              <Label>Tanggal Menang</Label>
              <Input type="date" value={manualForm.winDate} onChange={e => setManualForm(f => ({ ...f, winDate: e.target.value }))} />
            </div>
            <div>
              <Label>Nomor Telepon</Label>
              <Input placeholder="08xxxxxxxxxx" value={manualForm.phoneNumber} onChange={e => setManualForm(f => ({ ...f, phoneNumber: e.target.value }))} />
            </div>
            <div>
              <Label>Nama (opsional)</Label>
              <Input placeholder="Nama pemenang" value={manualForm.displayName} onChange={e => setManualForm(f => ({ ...f, displayName: e.target.value }))} />
            </div>
            <div>
              <Label>Hadiah</Label>
              <Input type="text" placeholder="contoh: 10.000 / Smartphone OPPO Find N6 / Voucher Indomaret" value={manualForm.amount} onChange={e => setManualForm(f => ({ ...f, amount: e.target.value }))} />
            </div>
            <div>
              <Label>Nama Event</Label>
              <Input placeholder="Nama event" value={manualForm.eventName} onChange={e => setManualForm(f => ({ ...f, eventName: e.target.value }))} />
            </div>
            <div className="flex gap-2 pt-2">
              <Button onClick={submitManualForm} disabled={createManualMutation.isPending || updateManualMutation.isPending} className="flex-1 bg-green-600 hover:bg-green-700">
                {editingManual ? "Simpan Perubahan" : "Tambah"}
              </Button>
              <Button variant="outline" onClick={() => setManualDialogOpen(false)} className="flex-1">Batal</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Pemenang</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedWinner && (
                <div className="space-y-2 mt-4">
                  <p className="text-base font-semibold">Pemenang Terpilih:</p>
                  <div className="bg-gray-100 p-4 rounded">
                    <p><strong>Nomor Telepon:</strong> {selectedWinner.phoneNumber}</p>
                    <p><strong>Event:</strong> {selectedWinner.eventName}</p>
                    <p><strong>Jumlah Tiket:</strong> Rp {selectedWinner.amount.toLocaleString()}</p>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    Apakah Anda yakin ingin mengumumkan pemenang ini?
                  </p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel">Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmAnnouncement}
              data-testid="button-confirm"
              className="bg-green-600 hover:bg-green-700"
            >
              Konfirmasi
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {/* ── Upload Preview Dialog ──────────────────────────────────────────── */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-blue-600" />
              Preview Upload — {uploadFileName}
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-500">
            Ditemukan <strong>{uploadPreview.length}</strong> baris data. Periksa sebelum menyimpan.
          </p>
          <div className="overflow-auto flex-1 border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>No. Telepon</TableHead>
                  <TableHead>Hadiah</TableHead>
                  <TableHead>Event</TableHead>
                  <TableHead>Nama</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {uploadPreview.map((row, i) => (
                  <TableRow key={i} className={!row.phoneNumber || !row.eventName ? "bg-red-50" : ""}>
                    <TableCell>{row.winDate}</TableCell>
                    <TableCell>{row.phoneNumber || <span className="text-red-500">⚠ kosong</span>}</TableCell>
                    <TableCell>{row.amount}</TableCell>
                    <TableCell>{row.eventName || <span className="text-red-500">⚠ kosong</span>}</TableCell>
                    <TableCell>{row.displayName || "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t">
            <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>Batal</Button>
            <Button
              className="bg-blue-600 hover:bg-blue-700"
              disabled={uploadPreview.length === 0 || bulkCreateMutation.isPending}
              onClick={() => bulkCreateMutation.mutate(uploadPreview)}
            >
              {bulkCreateMutation.isPending ? "Menyimpan..." : `Simpan ${uploadPreview.length} Data`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Clear All Confirmation Dialog ──────────────────────────────────── */}
      <AlertDialog open={clearAllDialogOpen} onOpenChange={setClearAllDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600">Hapus Semua Entri?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini akan menghapus <strong>semua {manualHistory?.length ?? 0} entri</strong> Riwayat Pemenang Manual secara permanen.
              Data tidak dapat dipulihkan. Pastikan Anda sudah siap memasukkan data baru.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => clearAllManualMutation.mutate()}
              className="bg-red-600 hover:bg-red-700"
            >
              Ya, Hapus Semua
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SidebarProvider>
  );
}
