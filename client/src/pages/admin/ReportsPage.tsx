import { useQuery } from "@tanstack/react-query";
import { AdminSidebar } from "@/components/AdminSidebar";
import { AdminPageHeader } from "@/components/AdminPageHeader";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import * as XLSX from 'xlsx';
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
  FileText,
  Download,
  TrendingUp,
  DollarSign,
  Users,
  Trophy,
  Calendar,
  Receipt,
  BarChart3,
} from "lucide-react";
import { useState } from "react";
import type { Event, Transaction, Winner, User } from "@shared/schema";

export default function ReportsPage() {
  const [selectedEventId, setSelectedEventId] = useState<string>("__all__");
  const [reportType, setReportType] = useState<string>("overview");
  const [dateRange, setDateRange] = useState<string>("all");
  const [customStartDate, setCustomStartDate] = useState<string>("");
  const [customEndDate, setCustomEndDate] = useState<string>("");

  const { data: events } = useQuery<Event[]>({
    queryKey: ["/api/admin/events"],
  });

  const { data: transactions } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
  });

  const { data: winners } = useQuery<Winner[]>({
    queryKey: ["/api/winners"],
  });

  const { data: users } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  // Date range filter helper
  const getDateRangeFilter = () => {
    const now = new Date();
    let startDate: Date | null = null;
    let endDate: Date | null = null;

    switch (dateRange) {
      case "today":
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
        break;
      case "week":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        endDate = now;
        break;
      case "month":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = now;
        break;
      case "custom":
        if (customStartDate) startDate = new Date(customStartDate);
        if (customEndDate) endDate = new Date(customEndDate + "T23:59:59");
        break;
      default:
        return null;
    }

    return { startDate, endDate };
  };

  // Filter transactions by date range
  const filterByDateRange = (items: Transaction[]) => {
    const range = getDateRangeFilter();
    if (!range || !range.startDate) return items;

    return items.filter(t => {
      const transactionDate = new Date(t.createdAt);
      if (range.startDate && transactionDate < range.startDate) return false;
      if (range.endDate && transactionDate > range.endDate) return false;
      return true;
    });
  };

  // Filter data based on selected event and date range
  let filteredTransactions = selectedEventId !== "__all__"
    ? transactions?.filter(t => t.eventId === selectedEventId) || []
    : transactions || [];

  filteredTransactions = filterByDateRange(filteredTransactions);

  const filteredWinners = selectedEventId !== "__all__"
    ? winners?.filter(w => w.eventId === selectedEventId) || []
    : winners || [];

  // Calculate statistics
  const totalRevenue = filteredTransactions.reduce((sum, t) => sum + t.amount, 0);
  const totalParticipants = filteredTransactions.length;
  const totalWinners = filteredWinners.length;
  const averageTransaction = totalParticipants > 0 ? totalRevenue / totalParticipants : 0;

  // Group transactions by event with profit/loss calculation
  const eventStats = events?.map(event => {
    let eventTransactions = transactions?.filter(t => t.eventId === event.id) || [];
    eventTransactions = filterByDateRange(eventTransactions);

    const eventWinners = winners?.filter(w => w.eventId === event.id) || [];
    const revenue = eventTransactions.reduce((sum, t) => sum + t.amount, 0);

    // Calculate profit/loss
    // Profit = Revenue - (Prize Amount * Number of Winners)
    const prizeAmount = event.hadiahAmount || 0;
    const totalPrizesPaid = prizeAmount * eventWinners.length;
    const profitLoss = revenue - totalPrizesPaid;

    return {
      eventId: event.id,
      eventName: event.name,
      participants: eventTransactions.length,
      winners: eventWinners.length,
      revenue: revenue,
      prizeAmount: prizeAmount,
      totalPrizesPaid: totalPrizesPaid,
      profitLoss: profitLoss,
      status: event.status,
    };
  }) || [];

  // Sort event stats by different criteria
  const sortedEventStats = [...eventStats].sort((a, b) => {
    if (reportType === "most-profit") {
      return b.profitLoss - a.profitLoss;
    } else if (reportType === "most-participants") {
      return b.participants - a.participants;
    } else if (reportType === "most-revenue") {
      return b.revenue - a.revenue;
    }
    return 0;
  });

  // Calculate total profit/loss
  const totalProfitLoss = eventStats.reduce((sum, e) => sum + e.profitLoss, 0);

  // Export to Excel function
  const exportToExcel = () => {
    let data: any[] = [];
    let headers: string[] = [];
    let filename = '';

    if (reportType === "overview") {
      headers = ["No", "Event", "Status", "Peserta", "Pemenang", "Pendapatan"];
      data = eventStats.map((stat, index) => ({
        "No": index + 1,
        "Event": stat.eventName,
        "Status": stat.status,
        "Peserta": stat.participants,
        "Pemenang": stat.winners,
        "Pendapatan": stat.revenue
      }));
      filename = 'laporan-overview';
    } else if (reportType === "transactions") {
      headers = ["No", "Tanggal", "Event", "Nama", "Email", "Nomor Telepon", "Jumlah", "Status"];
      data = filteredTransactions.map((t, index) => {
        const user = users?.find(u => u.id === t.userId);
        const nama = t.buyerName || user?.name || '-';
        const email = t.buyerEmail || user?.email || '-';
        return {
          "No": index + 1,
          "Tanggal": new Date(t.createdAt).toLocaleDateString('id-ID'),
          "Event": t.eventName,
          "Nama": nama,
          "Email": email,
          "Nomor Telepon": t.phoneNumber,
          "Jumlah": t.amount,
          "Status": t.paymentStatus
        };
      });
      filename = 'laporan-transaksi';
    } else if (reportType === "winners") {
      headers = ["No", "Tanggal", "Event", "Nama", "Nomor Telepon"];
      data = filteredWinners.map((w, index) => {
        const user = users?.find(u => u.id === w.userId);
        const event = events?.find(e => e.id === w.eventId);
        return {
          "No": index + 1,
          "Tanggal": new Date(w.announcedAt).toLocaleDateString('id-ID'),
          "Event": event?.name || '-',
          "Nama": user?.name || '-',
          "Nomor Telepon": user?.phoneNumber || '-'
        };
      });
      filename = 'laporan-pemenang';
    }

    // Create worksheet from data
    const worksheet = XLSX.utils.json_to_sheet(data);

    // Create workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan");

    // Generate Excel file and trigger download
    XLSX.writeFile(workbook, `${filename}-${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const stats = [
    {
      title: "Total Pendapatan",
      value: `Rp ${totalRevenue.toLocaleString('id-ID')}`,
      icon: DollarSign,
      gradient: "from-green-500 to-emerald-600",
      description: selectedEventId !== "__all__" ? "Event terpilih" : "Semua event",
    },
    {
      title: "Total Profit/Loss",
      value: `Rp ${totalProfitLoss.toLocaleString('id-ID')}`,
      icon: BarChart3,
      gradient: totalProfitLoss >= 0 ? "from-green-500 to-emerald-600" : "from-red-500 to-red-600",
      description: totalProfitLoss >= 0 ? "Profit" : "Loss",
    },
    {
      title: "Total Peserta",
      value: totalParticipants,
      icon: Users,
      gradient: "from-blue-500 to-blue-600",
      description: `${totalParticipants} transaksi`,
    },
    {
      title: "Total Pemenang",
      value: totalWinners,
      icon: Trophy,
      gradient: "from-purple-500 to-pink-600",
      description: `${totalWinners} pemenang diumumkan`,
    },
  ];

  return (
    <SidebarProvider>
      <AdminSidebar />
      <div className="flex flex-col flex-1 min-h-screen admin-light bg-gray-50">
        <AdminPageHeader
          title="Laporan"
          description="Statistik dan laporan lengkap platform"
          breadcrumbs={[
            { label: "Home", href: "/admin-panel-7x9k/dashboard" },
            { label: "Laporan" }
          ]}
        />

        <div className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Filter Section */}
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Filter Event
                    </label>
                    <Select value={selectedEventId} onValueChange={setSelectedEventId}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Pilih Event" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__all__">Semua Event</SelectItem>
                        {events?.map((event) => (
                          <SelectItem key={event.id} value={event.id}>
                            {event.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Jenis Laporan
                    </label>
                    <Select value={reportType} onValueChange={setReportType}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Pilih Jenis" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="overview">Ringkasan</SelectItem>
                        <SelectItem value="most-profit">Paling Untung</SelectItem>
                        <SelectItem value="most-participants">Paling Banyak Peserta</SelectItem>
                        <SelectItem value="most-revenue">Paling Banyak Revenue</SelectItem>
                        <SelectItem value="transactions">Transaksi</SelectItem>
                        <SelectItem value="winners">Pemenang</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Range Waktu
                    </label>
                    <Select value={dateRange} onValueChange={setDateRange}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Pilih Range" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Semua Waktu</SelectItem>
                        <SelectItem value="today">Hari Ini</SelectItem>
                        <SelectItem value="week">7 Hari Terakhir</SelectItem>
                        <SelectItem value="month">Bulan Ini</SelectItem>
                        <SelectItem value="custom">Custom Range</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-end">
                    <Button
                      onClick={exportToExcel}
                      className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Export Excel
                    </Button>
                  </div>
                </div>

                {/* Custom Date Range */}
                {dateRange === "custom" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t">
                    <div>
                      <Label htmlFor="startDate">Tanggal Mulai</Label>
                      <Input
                        id="startDate"
                        type="date"
                        value={customStartDate}
                        onChange={(e) => setCustomStartDate(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="endDate">Tanggal Akhir</Label>
                      <Input
                        id="endDate"
                        type="date"
                        value={customEndDate}
                        onChange={(e) => setCustomEndDate(e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {stats.map((stat) => (
                <Card key={stat.title} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`p-3 bg-gradient-to-br ${stat.gradient} rounded-xl`}>
                        <stat.icon className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    <p className="text-gray-600 text-sm font-medium mb-1">{stat.title}</p>
                    <h3 className="text-3xl font-bold text-gray-900 mb-1">
                      {typeof stat.value === 'number' ? stat.value.toLocaleString('id-ID') : stat.value}
                    </h3>
                    <p className="text-xs text-gray-500">{stat.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Report Content */}
            {(reportType === "overview" || reportType === "most-profit" || reportType === "most-participants" || reportType === "most-revenue") && (
              <Card className="border-0 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    {reportType === "most-profit" && "Event Paling Untung"}
                    {reportType === "most-participants" && "Event Paling Banyak Peserta"}
                    {reportType === "most-revenue" && "Event Paling Banyak Revenue"}
                    {reportType === "overview" && "Ringkasan Per Event"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50">
                          <TableHead className="font-bold">No</TableHead>
                          <TableHead className="font-bold">Event</TableHead>
                          <TableHead className="font-bold">Status</TableHead>
                          <TableHead className="font-bold">Peserta</TableHead>
                          <TableHead className="font-bold">Pemenang</TableHead>
                          <TableHead className="font-bold">Pendapatan</TableHead>
                          <TableHead className="font-bold">Hadiah Dibayar</TableHead>
                          <TableHead className="font-bold">Profit/Loss</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(reportType === "overview" ? eventStats : sortedEventStats).map((stat, index) => (
                          <TableRow key={stat.eventId} className="hover:bg-gray-50">
                            <TableCell>{index + 1}</TableCell>
                            <TableCell className="font-medium">{stat.eventName}</TableCell>
                            <TableCell>
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                stat.status === 'aktif'
                                  ? 'bg-green-100 text-green-700'
                                  : stat.status === 'selesai'
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-gray-100 text-gray-700'
                              }`}>
                                {stat.status}
                              </span>
                            </TableCell>
                            <TableCell>{stat.participants}</TableCell>
                            <TableCell>{stat.winners}</TableCell>
                            <TableCell className="font-semibold">
                              Rp {stat.revenue.toLocaleString('id-ID')}
                            </TableCell>
                            <TableCell className="font-semibold text-red-600">
                              Rp {stat.totalPrizesPaid.toLocaleString('id-ID')}
                            </TableCell>
                            <TableCell className={`font-bold ${stat.profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {stat.profitLoss >= 0 ? '+' : ''}Rp {stat.profitLoss.toLocaleString('id-ID')}
                            </TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="bg-gray-100 font-bold">
                          <TableCell colSpan={5} className="text-right">TOTAL:</TableCell>
                          <TableCell>Rp {totalRevenue.toLocaleString('id-ID')}</TableCell>
                          <TableCell className="text-red-600">
                            Rp {eventStats.reduce((sum, e) => sum + e.totalPrizesPaid, 0).toLocaleString('id-ID')}
                          </TableCell>
                          <TableCell className={totalProfitLoss >= 0 ? 'text-green-600' : 'text-red-600'}>
                            {totalProfitLoss >= 0 ? '+' : ''}Rp {totalProfitLoss.toLocaleString('id-ID')}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}

            {reportType === "transactions" && (
              <Card className="border-0 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-600 text-white">
                  <CardTitle className="flex items-center gap-2">
                    <Receipt className="w-5 h-5" />
                    Laporan Transaksi
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50">
                          <TableHead className="font-bold">No</TableHead>
                          <TableHead className="font-bold">Tanggal</TableHead>
                          <TableHead className="font-bold">Event</TableHead>
                          <TableHead className="font-bold">Nama</TableHead>
                          <TableHead className="font-bold">Email</TableHead>
                          <TableHead className="font-bold">Nomor Telepon</TableHead>
                          <TableHead className="font-bold">Jumlah</TableHead>
                          <TableHead className="font-bold">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredTransactions.map((transaction, index) => {
                          const user = users?.find(u => u.id === transaction.userId);
                          const nama = transaction.buyerName || user?.name || '-';
                          const email = transaction.buyerEmail || user?.email || '-';
                          return (
                          <TableRow key={transaction.id} className="hover:bg-gray-50">
                            <TableCell className="font-semibold">{index + 1}</TableCell>
                            <TableCell>
                              {new Date(transaction.createdAt).toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                              })}
                            </TableCell>
                            <TableCell className="font-medium">{transaction.eventName}</TableCell>
                            <TableCell className="font-medium">{nama}</TableCell>
                            <TableCell className="text-gray-600">{email}</TableCell>
                            <TableCell>
                              <span className="font-mono bg-gray-100 px-3 py-1 rounded-full text-sm">
                                {transaction.phoneNumber}
                              </span>
                            </TableCell>
                            <TableCell className="font-semibold">
                              Rp {transaction.amount.toLocaleString('id-ID')}
                            </TableCell>
                            <TableCell>
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                transaction.paymentStatus === 'paid'
                                  ? 'bg-green-100 text-green-700'
                                  : transaction.paymentStatus === 'pending'
                                  ? 'bg-yellow-100 text-yellow-700'
                                  : transaction.paymentStatus === 'expired'
                                  ? 'bg-gray-100 text-gray-600'
                                  : 'bg-red-100 text-red-700'
                              }`}>
                                {transaction.paymentStatus}
                              </span>
                            </TableCell>
                          </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}

            {reportType === "winners" && (
              <Card className="border-0 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="w-5 h-5" />
                    Laporan Pemenang
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50">
                          <TableHead className="font-bold">No</TableHead>
                          <TableHead className="font-bold">Tanggal</TableHead>
                          <TableHead className="font-bold">Event</TableHead>
                          <TableHead className="font-bold">Nama</TableHead>
                          <TableHead className="font-bold">Nomor Telepon</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredWinners.map((winner, index) => {
                          const user = users?.find(u => u.id === winner.userId);
                          const event = events?.find(e => e.id === winner.eventId);
                          return (
                            <TableRow key={winner.id} className="hover:bg-gray-50">
                              <TableCell className="font-semibold">{index + 1}</TableCell>
                              <TableCell>
                                {new Date(winner.announcedAt).toLocaleDateString('id-ID', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric'
                                })}
                              </TableCell>
                              <TableCell className="font-medium">{event?.name || "-"}</TableCell>
                              <TableCell>{user?.name || "-"}</TableCell>
                              <TableCell>
                                <span className="font-mono bg-gray-100 px-3 py-1 rounded-full text-sm">
                                  {user?.phoneNumber || "-"}
                                </span>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Empty State */}
            {((reportType === "transactions" && filteredTransactions.length === 0) ||
              (reportType === "winners" && filteredWinners.length === 0) ||
              (reportType === "overview" && eventStats.length === 0)) && (
              <Card className="border-0 shadow-lg p-12">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 mb-6">
                    <FileText className="w-12 h-12 text-gray-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">Tidak Ada Data</h3>
                  <p className="text-gray-600 max-w-md mx-auto">
                    Belum ada data untuk ditampilkan. Silakan pilih filter yang berbeda atau tunggu hingga ada data tersedia.
                  </p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
}

