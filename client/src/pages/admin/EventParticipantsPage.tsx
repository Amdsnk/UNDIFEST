import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { ArrowLeft, Search, Trophy, FileDown, RefreshCw } from "lucide-react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/AdminSidebar";
import { AdminPageHeader } from "@/components/AdminPageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { User, Transaction, Event, Winner } from "@shared/schema";

type SortField = "name" | "phone" | "city" | "email" | "totalTickets" | "totalAmount" | "status" | "ip" | "createdAt";

export default function EventParticipantsPage() {
  const [, params] = useRoute("/admin-panel-7x9k/events/:id/participants");
  const [, setLocation] = useLocation();
  const eventId = params?.id;
  const { toast } = useToast();

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string[]>(["active", "inactive"]);
  const [filterWinnerStatus, setFilterWinnerStatus] = useState<string[]>(["winner", "participant"]);
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const { data: event, isLoading: isLoadingEvent } = useQuery<Event>({
    queryKey: [`/api/events/${eventId}`],
    enabled: !!eventId,
  });

  const { data: users = [], isLoading: isLoadingUsers } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const { data: transactions = [], isLoading: isLoadingTransactions } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
  });

  const { data: winners = [], isLoading: isLoadingWinners } = useQuery<Winner[]>({
    queryKey: ["/api/winners"],
  });

  const isLoading = isLoadingEvent || isLoadingUsers || isLoadingTransactions || isLoadingWinners;

  // Invalidate cached data when this page is opened so we always see the latest transactions
  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
    queryClient.invalidateQueries({ queryKey: ["/api/users"] });
    queryClient.invalidateQueries({ queryKey: ["/api/winners"] });
    if (eventId) {
      queryClient.invalidateQueries({ queryKey: [`/api/events/${eventId}`] });
    }
  }, [eventId]);

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
    queryClient.invalidateQueries({ queryKey: ["/api/users"] });
    queryClient.invalidateQueries({ queryKey: ["/api/winners"] });
    if (eventId) {
      queryClient.invalidateQueries({ queryKey: [`/api/events/${eventId}`] });
    }
  };

  const nominateWinnerMutation = useMutation({
    mutationFn: async ({ userId, eventId: evId }: { userId: string; eventId: string }) => {
      return apiRequest("/api/winners/nominate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId, eventId: evId }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/winners"] });
      toast({
        title: "Berhasil",
        description: "Peserta berhasil dinominasikan sebagai pemenang",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Gagal",
        description: error.message || "Gagal menominasikan pemenang",
      });
    },
  });

  const cancelNominationMutation = useMutation({
    mutationFn: async ({ userId, eventId: evId }: { userId: string; eventId: string }) => {
      return apiRequest(`/api/winners/${userId}/${evId}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/winners"] });
      toast({
        title: "Berhasil",
        description: "Nominasi pemenang berhasil dibatalkan",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Gagal",
        description: error.message || "Gagal membatalkan nominasi",
      });
    },
  });

  const nominateGuestMutation = useMutation({
    mutationFn: async ({ transactionId, eventId: evId }: { transactionId: string; eventId: string }) => {
      return apiRequest("/api/winners/nominate-guest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactionId, eventId: evId }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/winners"] });
      toast({ title: "Berhasil", description: "Guest berhasil dinominasikan sebagai pemenang" });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Gagal", description: error.message || "Gagal menominasikan guest" });
    },
  });

  const cancelGuestNominationMutation = useMutation({
    mutationFn: async ({ transactionId, eventId: evId }: { transactionId: string; eventId: string }) => {
      return apiRequest(`/api/winners/transaction/${transactionId}/${evId}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/winners"] });
      toast({ title: "Berhasil", description: "Nominasi guest berhasil dibatalkan" });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Gagal", description: error.message || "Gagal membatalkan nominasi guest" });
    },
  });

  const getUserStats = (userId: string, phoneNumber: string) => {
    const userTransactions = transactions.filter(
      t => (t.userId === userId || t.phoneNumber === phoneNumber) &&
           t.eventId === eventId &&
           t.paymentStatus === "paid"
    );
    const totalTickets = userTransactions.reduce((sum, t) => sum + t.ticketCount, 0);
    const totalAmount = userTransactions.reduce((sum, t) => sum + t.amount, 0);
    return { totalTickets, totalAmount };
  };

  const toggleFilterStatus = (status: string) => {
    setFilterStatus(prev =>
      prev.includes(status)
        ? prev.filter(s => s !== status)
        : [...prev, status]
    );
    setCurrentPage(1);
  };

  const toggleFilterWinnerStatus = (status: string) => {
    setFilterWinnerStatus(prev =>
      prev.includes(status)
        ? prev.filter(s => s !== status)
        : [...prev, status]
    );
    setCurrentPage(1);
  };

  const eventParticipants = users.filter(user =>
    transactions.some(
      t => t.eventId === eventId &&
           t.paymentStatus === "paid" &&
           (t.userId === user.id || t.phoneNumber === user.phoneNumber)
    )
  );

  // Guest participants: paid transactions without a matching registered user
  const registeredPhones = new Set(users.map(u => u.phoneNumber));
  const guestTransactions = transactions.filter(
    t => t.eventId === eventId &&
         t.paymentStatus === "paid" &&
         !t.userId &&
         !registeredPhones.has(t.phoneNumber)
  );
  // Deduplicate guests by phone number
  const guestParticipantsMap = new Map<string, typeof guestTransactions[0]>();
  guestTransactions.forEach(t => {
    if (!guestParticipantsMap.has(t.phoneNumber)) {
      guestParticipantsMap.set(t.phoneNumber, t);
    }
  });
  const guestParticipants = Array.from(guestParticipantsMap.values());

  const getGuestStats = (phone: string) => {
    const gt = transactions.filter(
      t => t.phoneNumber === phone && t.eventId === eventId && t.paymentStatus === "paid"
    );
    return {
      totalTickets: gt.reduce((sum, t) => sum + t.ticketCount, 0),
      totalAmount: gt.reduce((sum, t) => sum + t.amount, 0),
    };
  };

  const filteredUsers = eventParticipants
    .filter(user => {
      const matchesSearch = searchTerm === "" ||
        (user.name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        user.phoneNumber.includes(searchTerm) ||
        (user.email?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (user.city?.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesAccountStatus = filterStatus.length === 0 ||
        (filterStatus.includes("active") && user.isActive) ||
        (filterStatus.includes("inactive") && !user.isActive);

      const userIsWinner = winners.some(w => w.userId === user.id && w.eventId === eventId);
      const matchesWinnerStatus = filterWinnerStatus.length === 0 ||
        (filterWinnerStatus.includes("winner") && userIsWinner) ||
        (filterWinnerStatus.includes("participant") && !userIsWinner);

      return matchesSearch && matchesAccountStatus && matchesWinnerStatus;
    })
    .sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortField) {
        case "name":
          aValue = (a.name || "").toLowerCase();
          bValue = (b.name || "").toLowerCase();
          break;
        case "phone":
          aValue = a.phoneNumber;
          bValue = b.phoneNumber;
          break;
        case "city":
          aValue = (a.city || "").toLowerCase();
          bValue = (b.city || "").toLowerCase();
          break;
        case "email":
          aValue = (a.email || "").toLowerCase();
          bValue = (b.email || "").toLowerCase();
          break;
        case "totalTickets":
          aValue = getUserStats(a.id, a.phoneNumber).totalTickets;
          bValue = getUserStats(b.id, b.phoneNumber).totalTickets;
          break;
        case "totalAmount":
          aValue = getUserStats(a.id, a.phoneNumber).totalAmount;
          bValue = getUserStats(b.id, b.phoneNumber).totalAmount;
          break;
        case "status":
          aValue = a.isActive ? 1 : 0;
          bValue = b.isActive ? 1 : 0;
          break;
        case "ip":
          aValue = (a.ip || "").toLowerCase();
          bValue = (b.ip || "").toLowerCase();
          break;
        case "createdAt":
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
      if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleExportCSV = () => {
    const rows: string[][] = [];
    rows.push([
      "No", "Nama", "No WA", "Email", "No Rekening", "Kode Undian",
      "Waktu Ikut", "Kota", "IP", "Nominal (Rp)", "Status Peserta",
    ]);

    let rowNum = 1;

    // Registered users
    eventParticipants.forEach(user => {
      const stats = getUserStats(user.id, user.phoneNumber);
      const userTx = transactions.find(
        t => (t.userId === user.id || t.phoneNumber === user.phoneNumber) &&
             t.eventId === eventId && t.paymentStatus === "paid"
      );
      const lotteryCode = userTx ? `UND-${userTx.id.slice(0, 8).toUpperCase()}` : "-";
      const joinTime = userTx
        ? new Date(userTx.createdAt).toLocaleString("id-ID")
        : new Date(user.createdAt).toLocaleString("id-ID");
      const noRek = user.accountNumber
        ? `${user.bankName || ""} ${user.accountNumber}`.trim()
        : "-";

      rows.push([
        String(rowNum++),
        user.name || "-",
        user.phoneNumber,
        user.email || "-",
        noRek,
        lotteryCode,
        joinTime,
        user.city || "-",
        user.ip || "-",
        String(stats.totalAmount),
        "Akun Terdaftar",
      ]);
    });

    // Guest participants
    guestParticipants.forEach(t => {
      const gs = getGuestStats(t.phoneNumber);
      const lotteryCode = `UND-${t.id.slice(0, 8).toUpperCase()}`;
      const joinTime = new Date(t.createdAt).toLocaleString("id-ID");
      const noRek = t.buyerAccountNumber
        ? `${t.buyerBankName || ""} ${t.buyerAccountNumber}`.trim()
        : "-";

      rows.push([
        String(rowNum++),
        t.buyerName || "-",
        t.phoneNumber,
        t.buyerEmail || "-",
        noRek,
        lotteryCode,
        joinTime,
        "-",
        t.buyerIp || "-",
        String(gs.totalAmount),
        "Guest (Tanpa Akun)",
      ]);
    });

    const csv = rows.map(row =>
      row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",")
    ).join("\n");

    const bom = "\uFEFF"; // BOM for Excel UTF-8 support
    const blob = new Blob([bom + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `peserta-${event?.name || eventId}-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 4) {
        pages.push(1, 2, 3, 4, 5, "...", totalPages);
      } else if (currentPage >= totalPages - 3) {
        pages.push(1, "...", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages);
      }
    }
    return pages;
  };

  return (
    <SidebarProvider>
      <AdminSidebar />
      <div className="flex flex-col flex-1 min-h-screen min-w-0 admin-light bg-gradient-to-br from-blue-50 via-purple-50/30 to-pink-50/30">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg">
          <div className="w-full px-6 py-6">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="bg-white/20 rounded-full p-2">
                    <Trophy className="w-6 h-6" />
                  </div>
                  <h1 className="text-3xl font-bold">Daftar Peserta Event</h1>
                </div>
                <p className="text-blue-100 text-lg ml-11">{event?.name || "Loading..."}</p>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <Button
                  variant="outline"
                  onClick={handleRefresh}
                  disabled={isLoading}
                  className="bg-blue-500/20 border-blue-300/50 text-white hover:bg-blue-500/40 hover:border-blue-300 transition-all"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
                  Refresh Data
                </Button>
                <Button
                  variant="outline"
                  onClick={handleExportCSV}
                  className="bg-green-500/20 border-green-300/50 text-white hover:bg-green-500/40 hover:border-green-300 transition-all"
                >
                  <FileDown className="w-4 h-4 mr-2" />
                  Export Excel
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setLocation("/admin-panel-7x9k/events")}
                  className="bg-white/10 border-white/30 text-white hover:bg-white/20 hover:border-white/50 transition-all"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Kembali ke Daftar Event
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 p-4 md:p-6 overflow-y-auto">
          <div className="space-y-6">

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-lg">
                <div className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100 text-sm font-medium">Total Peserta</p>
                      <p className="text-3xl font-bold mt-1">{eventParticipants.length + guestParticipants.length}</p>
                    </div>
                    <div className="bg-white/20 rounded-full p-3">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="bg-gradient-to-br from-green-500 to-emerald-600 text-white border-0 shadow-lg">
                <div className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-100 text-sm font-medium">Pemenang</p>
                      <p className="text-3xl font-bold mt-1">
                        {winners.filter(w => w.eventId === eventId).length}
                      </p>
                    </div>
                    <div className="bg-white/20 rounded-full p-3">
                      <Trophy className="w-6 h-6" />
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="bg-gradient-to-br from-purple-500 to-pink-600 text-white border-0 shadow-lg">
                <div className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-100 text-sm font-medium">Akun Aktif</p>
                      <p className="text-3xl font-bold mt-1">
                        {eventParticipants.filter(u => u.isActive).length}
                      </p>
                    </div>
                    <div className="bg-white/20 rounded-full p-3">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="bg-gradient-to-br from-orange-500 to-red-600 text-white border-0 shadow-lg">
                <div className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-orange-100 text-sm font-medium">Hasil Filter</p>
                      <p className="text-3xl font-bold mt-1">{filteredUsers.length}</p>
                    </div>
                    <div className="bg-white/20 rounded-full p-3">
                      <Search className="w-6 h-6" />
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            <Card className="bg-white shadow-lg border-0 rounded-xl">
              <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-xl">
                <CardTitle className="text-2xl font-bold flex items-center gap-2">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  Daftar Peserta
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="flex flex-col gap-6 mb-6">
                  {/* Search Bar */}
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <Input
                      placeholder="Cari berdasarkan nama, telepon, email, atau kota..."
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="pl-12 h-12 text-base border-2 border-gray-200 focus:border-purple-500 rounded-lg"
                    />
                  </div>

                  {/* Filters */}
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-100">
                    <div className="flex flex-wrap items-center gap-6">
                      <span className="text-sm font-bold text-gray-700">Filter:</span>

                      <div className="flex items-center gap-4">
                        <span className="text-xs font-semibold text-gray-600">Status Akun:</span>
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id="filter-aktif"
                            checked={filterStatus.includes("active")}
                            onCheckedChange={() => toggleFilterStatus("active")}
                            className="border-2"
                          />
                          <label htmlFor="filter-aktif" className="text-sm cursor-pointer font-medium">
                            Aktif
                          </label>
                        </div>

                        <div className="flex items-center gap-2">
                          <Checkbox
                            id="filter-belum"
                            checked={filterStatus.includes("inactive")}
                            onCheckedChange={() => toggleFilterStatus("inactive")}
                            className="border-2"
                          />
                          <label htmlFor="filter-belum" className="text-sm cursor-pointer font-medium">
                            Tidak Aktif
                          </label>
                        </div>
                      </div>

                      <div className="h-6 w-px bg-gray-300"></div>

                      <div className="flex items-center gap-4">
                        <span className="text-xs font-semibold text-gray-600">Status Pemenang:</span>
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id="filter-pemenang"
                            checked={filterWinnerStatus.includes("winner")}
                            onCheckedChange={() => toggleFilterWinnerStatus("winner")}
                            className="border-2"
                          />
                          <label htmlFor="filter-pemenang" className="text-sm cursor-pointer font-medium">
                            Pemenang
                          </label>
                        </div>

                        <div className="flex items-center gap-2">
                          <Checkbox
                            id="filter-peserta"
                            checked={filterWinnerStatus.includes("participant")}
                            onCheckedChange={() => toggleFilterWinnerStatus("participant")}
                            className="border-2"
                          />
                          <label htmlFor="filter-peserta" className="text-sm cursor-pointer font-medium">
                            Peserta
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border-2 border-gray-200 overflow-x-auto">
                  <Table className="min-w-[900px]">
                    <TableHeader>
                      <TableRow className="bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-50">
                        <TableHead className="font-bold text-gray-700">ID</TableHead>
                        <TableHead
                          className="font-bold cursor-pointer hover:bg-purple-50 text-gray-700 transition-colors"
                          onClick={() => handleSort("name")}
                        >
                          Nama {sortField === "name" && (sortOrder === "asc" ? "↑" : "↓")}
                        </TableHead>
                        <TableHead
                          className="font-bold cursor-pointer hover:bg-purple-50 text-gray-700 transition-colors"
                          onClick={() => handleSort("phone")}
                        >
                          No WA {sortField === "phone" && (sortOrder === "asc" ? "↑" : "↓")}
                        </TableHead>
                        <TableHead
                          className="font-bold cursor-pointer hover:bg-purple-50 text-gray-700 transition-colors"
                          onClick={() => handleSort("city")}
                        >
                          Kota {sortField === "city" && (sortOrder === "asc" ? "↑" : "↓")}
                        </TableHead>
                        <TableHead
                          className="font-bold cursor-pointer hover:bg-purple-50 text-gray-700 transition-colors"
                          onClick={() => handleSort("email")}
                        >
                          Email {sortField === "email" && (sortOrder === "asc" ? "↑" : "↓")}
                        </TableHead>
                        <TableHead className="font-bold text-gray-700">
                          No Rekening
                        </TableHead>
                        <TableHead
                          className="font-bold cursor-pointer hover:bg-purple-50 text-right text-gray-700 transition-colors"
                          onClick={() => handleSort("totalTickets")}
                        >
                          Total Tiket {sortField === "totalTickets" && (sortOrder === "asc" ? "↑" : "↓")}
                        </TableHead>
                        <TableHead
                          className="font-bold cursor-pointer hover:bg-purple-50 text-right text-gray-700 transition-colors"
                          onClick={() => handleSort("totalAmount")}
                        >
                          Total Rp {sortField === "totalAmount" && (sortOrder === "asc" ? "↑" : "↓")}
                        </TableHead>
                        <TableHead
                          className="font-bold cursor-pointer hover:bg-purple-50 text-gray-700 transition-colors"
                          onClick={() => handleSort("status")}
                        >
                          Status Akun {sortField === "status" && (sortOrder === "asc" ? "↑" : "↓")}
                        </TableHead>
                        <TableHead
                          className="font-bold cursor-pointer hover:bg-purple-50 text-gray-700 transition-colors"
                          onClick={() => handleSort("ip")}
                        >
                          IP {sortField === "ip" && (sortOrder === "asc" ? "↑" : "↓")}
                        </TableHead>
                        <TableHead
                          className="font-bold cursor-pointer hover:bg-purple-50 text-gray-700 transition-colors"
                          onClick={() => handleSort("createdAt")}
                        >
                          Tgl Regist {sortField === "createdAt" && (sortOrder === "asc" ? "↑" : "↓")}
                        </TableHead>
                        <TableHead className="font-bold text-gray-700">
                          Aksi
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoading ? (
                        <TableRow>
                          <TableCell colSpan={12} className="text-center py-12">
                            <div className="flex flex-col items-center gap-3">
                              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                              <p className="text-gray-500 font-medium">Memuat data...</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : paginatedUsers.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={12} className="text-center py-12">
                            <div className="flex flex-col items-center gap-3">
                              <div className="bg-gray-100 rounded-full p-4">
                                <Search className="w-12 h-12 text-gray-400" />
                              </div>
                              <p className="text-gray-500 font-medium text-lg">Tidak ada peserta ditemukan</p>
                              <p className="text-gray-400 text-sm">Coba ubah filter atau kata kunci pencarian</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        paginatedUsers.map((user, index) => {
                          const stats = getUserStats(user.id, user.phoneNumber);
                          const isWinner = winners.some(w => w.userId === user.id && w.eventId === eventId);
                          const rowNumber = (currentPage - 1) * itemsPerPage + index + 1;

                          return (
                            <TableRow key={user.id} className="hover:bg-purple-50/50 transition-colors">
                              <TableCell className="font-semibold text-gray-700">
                                {rowNumber}
                              </TableCell>
                              <TableCell className="font-semibold">
                                <div className="flex flex-col gap-1">
                                  <div className="font-semibold text-gray-900">{user.name || "-"}</div>
                                  {isWinner && (
                                    <span className="inline-flex items-center gap-1 text-xs bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-2 py-0.5 rounded-full font-bold w-fit">
                                      <Trophy className="w-3 h-3" />
                                      Pemenang
                                    </span>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <span className="font-mono bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                                  {user.phoneNumber}
                                </span>
                              </TableCell>
                              <TableCell className="text-gray-700">{user.city || "-"}</TableCell>
                              <TableCell className="text-gray-700">{user.email || "-"}</TableCell>
                              <TableCell>
                                <div className="flex flex-col text-sm">
                                  {user.accountNumber ? (
                                    <>
                                      <span className="font-mono bg-gray-100 px-2 py-0.5 rounded text-gray-700">{user.accountNumber}</span>
                                      {user.bankName && <span className="text-xs text-gray-500 mt-0.5">{user.bankName}</span>}
                                    </>
                                  ) : (
                                    <span className="text-gray-400">-</span>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                <span className="inline-flex items-center gap-1 bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-bold">
                                  {stats.totalTickets}
                                </span>
                              </TableCell>
                              <TableCell className="text-right">
                                <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-bold whitespace-nowrap">
                                  {new Intl.NumberFormat("id-ID").format(stats.totalAmount)}
                                </span>
                              </TableCell>
                              <TableCell>
                                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${
                                  user.isActive
                                    ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white"
                                    : "bg-gradient-to-r from-red-500 to-orange-600 text-white"
                                }`}>
                                  {user.isActive ? "Lengkap" : "Belum"}
                                </span>
                              </TableCell>
                              <TableCell>
                                <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded text-gray-600">
                                  {user.ip || "-"}
                                </span>
                              </TableCell>
                              <TableCell className="text-gray-600">
                                <div className="flex flex-col">
                                  <span className="font-medium">
                                    {new Date(user.createdAt).toLocaleDateString("id-ID", {
                                      day: "2-digit",
                                      month: "short",
                                      year: "numeric",
                                    })}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {new Date(user.createdAt).toLocaleTimeString("id-ID", {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                {!isWinner ? (
                                  <Button
                                    size="sm"
                                    onClick={() => nominateWinnerMutation.mutate({ userId: user.id, eventId: eventId! })}
                                    disabled={nominateWinnerMutation.isPending}
                                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold shadow-md hover:shadow-lg transition-all"
                                  >
                                    <Trophy className="w-3 h-3 mr-1" />
                                    Nominasi
                                  </Button>
                                ) : (
                                  <Button
                                    size="sm"
                                    onClick={() => cancelNominationMutation.mutate({ userId: user.id, eventId: eventId! })}
                                    disabled={cancelNominationMutation.isPending}
                                    className="bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 text-white font-semibold shadow-md hover:shadow-lg transition-all"
                                  >
                                    ❌ Batalkan
                                  </Button>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>

                <div className="flex flex-col md:flex-row items-center justify-between mt-6 gap-4 bg-gradient-to-r from-gray-50 to-purple-50 p-4 rounded-lg border border-purple-100">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-gray-700">📄 Tampilkan:</span>
                    <Select
                      value={itemsPerPage.toString()}
                      onValueChange={(value) => {
                        setItemsPerPage(parseInt(value));
                        setCurrentPage(1);
                      }}
                    >
                      <SelectTrigger className="w-[140px] border-2 border-purple-200 hover:border-purple-400 transition-colors">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">📋 10 / page</SelectItem>
                        <SelectItem value="25">📋 25 / page</SelectItem>
                        <SelectItem value="50">📋 50 / page</SelectItem>
                        <SelectItem value="100">📋 100 / page</SelectItem>
                      </SelectContent>
                    </Select>
                    <span className="text-sm font-medium text-gray-600 bg-white px-3 py-1 rounded-full border border-gray-200">
                      Menampilkan <span className="font-bold text-purple-600">{paginatedUsers.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}</span> - <span className="font-bold text-purple-600">{Math.min(currentPage * itemsPerPage, filteredUsers.length)}</span> dari <span className="font-bold text-blue-600">{filteredUsers.length}</span> peserta
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                      className="border-2 hover:bg-purple-50 hover:border-purple-300 disabled:opacity-50"
                    >
                      ⏮️ First
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="border-2 hover:bg-purple-50 hover:border-purple-300 disabled:opacity-50"
                    >
                      ◀️ Prev
                    </Button>

                    {getPageNumbers().map((page, idx) =>
                      typeof page === "number" ? (
                        <Button
                          key={idx}
                          variant={currentPage === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(page)}
                          className={`w-10 border-2 transition-all ${
                            currentPage === page
                              ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white border-purple-600 shadow-lg"
                              : "hover:bg-purple-50 hover:border-purple-300"
                          }`}
                        >
                          {page}
                        </Button>
                      ) : (
                        <span key={idx} className="px-2 text-gray-400 font-bold">
                          {page}
                        </span>
                      )
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="border-2 hover:bg-purple-50 hover:border-purple-300 disabled:opacity-50"
                    >
                      Next ▶️
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages}
                      className="border-2 hover:bg-purple-50 hover:border-purple-300 disabled:opacity-50"
                    >
                      Last ⏭️
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Guest Participants Section */}
            {guestParticipants.length > 0 && (
              <Card className="bg-white shadow-lg border-0 rounded-xl">
                <CardHeader className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-6 rounded-t-xl">
                  <CardTitle className="text-2xl font-bold flex items-center gap-2">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Peserta Guest ({guestParticipants.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="rounded-xl border-2 border-gray-200 overflow-x-auto">
                    <Table className="min-w-[800px]">
                      <TableHeader>
                        <TableRow className="bg-gradient-to-r from-gray-50 to-gray-100">
                          <TableHead className="font-bold text-gray-700">No</TableHead>
                          <TableHead className="font-bold text-gray-700">Nama</TableHead>
                          <TableHead className="font-bold text-gray-700">No WA</TableHead>
                          <TableHead className="font-bold text-gray-700">Email</TableHead>
                          <TableHead className="font-bold text-gray-700">Bank</TableHead>
                          <TableHead className="font-bold text-gray-700">No. Rekening</TableHead>
                          <TableHead className="font-bold text-gray-700">IP</TableHead>
                          <TableHead className="font-bold text-right text-gray-700">Total Tiket</TableHead>
                          <TableHead className="font-bold text-right text-gray-700">Total Rp</TableHead>
                          <TableHead className="font-bold text-gray-700">Aksi</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {guestParticipants.map((t, index) => {
                          const gs = getGuestStats(t.phoneNumber);
                          const isGuestWinner = winners.some(w => w.transactionId === t.id && w.eventId === eventId);
                          return (
                            <TableRow key={t.phoneNumber} className="hover:bg-orange-50/50 transition-colors">
                              <TableCell className="font-semibold text-gray-700">{index + 1}</TableCell>
                              <TableCell className="font-semibold">
                                <div className="flex flex-col gap-1">
                                  <span className="font-semibold text-gray-900">{t.buyerName || "-"}</span>
                                  {isGuestWinner && (
                                    <span className="inline-flex items-center gap-1 text-xs bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-2 py-0.5 rounded-full font-bold w-fit">
                                      <Trophy className="w-3 h-3" />
                                      Pemenang
                                    </span>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <span className="font-mono bg-orange-50 text-orange-700 px-3 py-1 rounded-full text-sm font-medium">
                                  {t.phoneNumber}
                                </span>
                              </TableCell>
                              <TableCell className="text-gray-700">{t.buyerEmail || "-"}</TableCell>
                              <TableCell>
                                <span className="font-medium text-gray-700">{t.buyerBankName || "-"}</span>
                              </TableCell>
                              <TableCell>
                                <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded text-gray-700">{t.buyerAccountNumber || "-"}</span>
                              </TableCell>
                              <TableCell>
                                <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded text-gray-600">{t.buyerIp || "-"}</span>
                              </TableCell>
                              <TableCell className="text-right">
                                <span className="inline-flex items-center gap-1 bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-bold">
                                  {gs.totalTickets}
                                </span>
                              </TableCell>
                              <TableCell className="text-right">
                                <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-bold whitespace-nowrap">
                                  {new Intl.NumberFormat("id-ID").format(gs.totalAmount)}
                                </span>
                              </TableCell>
                              <TableCell>
                                {!isGuestWinner ? (
                                  <Button
                                    size="sm"
                                    onClick={() => nominateGuestMutation.mutate({ transactionId: t.id, eventId: eventId! })}
                                    disabled={nominateGuestMutation.isPending}
                                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold shadow-md hover:shadow-lg transition-all"
                                  >
                                    <Trophy className="w-3 h-3 mr-1" />
                                    Nominasi
                                  </Button>
                                ) : (
                                  <Button
                                    size="sm"
                                    onClick={() => cancelGuestNominationMutation.mutate({ transactionId: t.id, eventId: eventId! })}
                                    disabled={cancelGuestNominationMutation.isPending}
                                    className="bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 text-white font-semibold shadow-md hover:shadow-lg transition-all"
                                  >
                                    ❌ Batalkan
                                  </Button>
                                )}
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
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
}
