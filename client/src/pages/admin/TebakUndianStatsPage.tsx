import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AdminSidebar } from "@/components/AdminSidebar";
import { AdminPageHeader } from "@/components/AdminPageHeader";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Shuffle, Users, TrendingUp, BarChart3 } from "lucide-react";

type DailyStat = { date: string; besar: number; kecil: number; total: number };
type Participant = {
  id: string;
  buyerName: string;
  phoneNumber: string;
  eventName: string;
  undianType: string;
  label: string;
  amount: number;
  createdAt: string;
};
type StatsResponse = {
  totalBesar: number;
  totalKecil: number;
  total: number;
  dailyStats: DailyStat[];
  participants: Participant[];
};

export default function TebakUndianStatsPage() {
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<"all" | "A" | "B">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const { data, isLoading } = useQuery<StatsResponse>({
    queryKey: ["/api/admin/tebak-undian/stats"],
    staleTime: 30000,
    refetchInterval: 60000,
  });

  // Filter participants
  const filtered = (data?.participants ?? []).filter((p) => {
    const matchSearch =
      !search ||
      p.buyerName.toLowerCase().includes(search.toLowerCase()) ||
      p.phoneNumber.includes(search) ||
      p.eventName.toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === "all" || p.undianType === filterType;
    return matchSearch && matchType;
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleSearch = (val: string) => {
    setSearch(val);
    setCurrentPage(1);
  };
  const handleFilter = (val: string) => {
    setFilterType(val as "all" | "A" | "B");
    setCurrentPage(1);
  };

  return (
    <SidebarProvider>
      <AdminSidebar />
      <div className="flex flex-col flex-1 min-h-screen admin-light bg-gray-50">
        <AdminPageHeader
          title="Tebak Undian"
          description="Statistik harian dan daftar peserta Tebak Undian"
          breadcrumbs={[
            { label: "Home", href: "/admin-panel-7x9k/dashboard" },
            { label: "Tebak Undian" },
          ]}
        />

        <div className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-7xl mx-auto space-y-6">

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border-0 shadow-md">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="bg-blue-100 p-3 rounded-xl">
                    <TrendingUp className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Besar (A)</p>
                    <p className="text-3xl font-bold text-blue-600">
                      {isLoading ? "—" : (data?.totalBesar ?? 0)}
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-md">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="bg-purple-100 p-3 rounded-xl">
                    <BarChart3 className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Kecil (B)</p>
                    <p className="text-3xl font-bold text-purple-600">
                      {isLoading ? "—" : (data?.totalKecil ?? 0)}
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-md">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="bg-gray-100 p-3 rounded-xl">
                    <Users className="w-6 h-6 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Peserta</p>
                    <p className="text-3xl font-bold text-gray-800">
                      {isLoading ? "—" : (data?.total ?? 0)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Tabs: Daily Stats / Participants */}
            <Tabs defaultValue="participants">
              <TabsList className="mb-4">
                <TabsTrigger value="participants">
                  <Users className="w-4 h-4 mr-2" />
                  Daftar Peserta
                </TabsTrigger>
                <TabsTrigger value="daily">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Rekap Harian
                </TabsTrigger>
              </TabsList>

              {/* ── Participants Tab ── */}
              <TabsContent value="participants">
                <Card className="border-0 shadow-lg">
                  <CardHeader className="border-b pb-4">
                    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                      <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <Shuffle className="w-5 h-5 text-purple-600" />
                        Peserta Tebak Undian
                      </CardTitle>
                      <div className="flex gap-2 w-full sm:w-auto">
                        <div className="relative flex-1 sm:w-56">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <Input
                            placeholder="Cari nama / HP / event..."
                            value={search}
                            onChange={(e) => handleSearch(e.target.value)}
                            className="pl-9"
                          />
                        </div>
                        <Select value={filterType} onValueChange={handleFilter}>
                          <SelectTrigger className="w-32">
                            <SelectValue placeholder="Semua" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Semua</SelectItem>
                            <SelectItem value="A">Besar (A)</SelectItem>
                            <SelectItem value="B">Kecil (B)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    {isLoading ? (
                      <div className="text-center py-16 text-gray-400">Memuat data...</div>
                    ) : filtered.length === 0 ? (
                      <div className="text-center py-16">
                        <Shuffle className="w-14 h-14 mx-auto mb-3 text-gray-300" />
                        <p className="text-gray-500 font-medium">Tidak ada peserta ditemukan</p>
                      </div>
                    ) : (
                      <>
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-gray-50">
                                <TableHead className="w-8 font-semibold text-gray-600">#</TableHead>
                                <TableHead className="font-semibold text-gray-600">Nama</TableHead>
                                <TableHead className="font-semibold text-gray-600">No. HP</TableHead>
                                <TableHead className="font-semibold text-gray-600">Event</TableHead>
                                <TableHead className="text-center font-semibold text-gray-600">Pilihan</TableHead>
                                <TableHead className="font-semibold text-gray-600">Tanggal</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {paginated.map((p, i) => (
                                <TableRow key={p.id} className="hover:bg-gray-50 transition-colors">
                                  <TableCell className="text-gray-400 text-sm">
                                    {(currentPage - 1) * itemsPerPage + i + 1}
                                  </TableCell>
                                  <TableCell className="font-medium text-gray-800">{p.buyerName}</TableCell>
                                  <TableCell className="text-gray-600">{p.phoneNumber}</TableCell>
                                  <TableCell className="text-gray-600 max-w-[160px] truncate">{p.eventName}</TableCell>
                                  <TableCell className="text-center">
                                    <span
                                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                                        p.undianType === "A"
                                          ? "bg-blue-100 text-blue-700"
                                          : "bg-purple-100 text-purple-700"
                                      }`}
                                    >
                                      {p.label}
                                    </span>
                                  </TableCell>
                                  <TableCell className="text-gray-500 text-sm whitespace-nowrap">
                                    {new Date(p.createdAt).toLocaleDateString("id-ID", {
                                      day: "2-digit", month: "short", year: "numeric",
                                      hour: "2-digit", minute: "2-digit",
                                    })}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                          <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
                            <p className="text-sm text-gray-500">
                              {filtered.length} peserta • Halaman {currentPage} dari {totalPages}
                            </p>
                            <div className="flex gap-2">
                              <button
                                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="px-3 py-1 rounded border text-sm disabled:opacity-40 hover:bg-gray-100"
                              >
                                ‹ Prev
                              </button>
                              <button
                                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="px-3 py-1 rounded border text-sm disabled:opacity-40 hover:bg-gray-100"
                              >
                                Next ›
                              </button>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ── Daily Stats Tab ── */}
              <TabsContent value="daily">
                <Card className="border-0 shadow-lg">
                  <CardHeader className="border-b pb-4">
                    <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-blue-600" />
                      Rekap Harian
                    </CardTitle>
                    <p className="text-sm text-gray-500 mt-1">Jumlah peserta per hari (hanya transaksi lunas)</p>
                  </CardHeader>
                  <CardContent className="p-0">
                    {isLoading ? (
                      <div className="text-center py-16 text-gray-400">Memuat data...</div>
                    ) : !data?.dailyStats.length ? (
                      <div className="text-center py-16">
                        <BarChart3 className="w-14 h-14 mx-auto mb-3 text-gray-300" />
                        <p className="text-gray-500 font-medium">Belum ada data</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-gray-50">
                              <TableHead className="font-semibold text-gray-600">Tanggal</TableHead>
                              <TableHead className="text-center font-semibold text-blue-600">Besar (A)</TableHead>
                              <TableHead className="text-center font-semibold text-purple-600">Kecil (B)</TableHead>
                              <TableHead className="text-center font-semibold text-gray-700">Total</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {data.dailyStats.map((row) => (
                              <TableRow key={row.date} className="hover:bg-gray-50 transition-colors">
                                <TableCell className="font-medium text-gray-700">{row.date}</TableCell>
                                <TableCell className="text-center">
                                  <span className="inline-flex items-center justify-center w-9 h-7 rounded-full text-sm font-bold bg-blue-100 text-blue-700">
                                    {row.besar}
                                  </span>
                                </TableCell>
                                <TableCell className="text-center">
                                  <span className="inline-flex items-center justify-center w-9 h-7 rounded-full text-sm font-bold bg-purple-100 text-purple-700">
                                    {row.kecil}
                                  </span>
                                </TableCell>
                                <TableCell className="text-center">
                                  <span className="inline-flex items-center justify-center w-9 h-7 rounded-full text-sm font-bold bg-gray-200 text-gray-800">
                                    {row.total}
                                  </span>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
}
