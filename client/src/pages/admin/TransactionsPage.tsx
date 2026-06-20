import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminSidebar } from "@/components/AdminSidebar";
import { AdminPageHeader } from "@/components/AdminPageHeader";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, DollarSign, TrendingUp, Calendar, Receipt, Eye, Trash2, CheckCircle, Clock, XCircle, AlertCircle, RefreshCw, ExternalLink, Copy, MessageCircle, Send } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Transaction, User } from "@shared/schema";

export default function TransactionsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  // Dialog for "not found in Midtrans" case — lets admin see Order ID and confirm manually
  const [notFoundTx, setNotFoundTx] = useState<Transaction | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: transactions, isLoading } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
  });

  const { data: users } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  // Build lookup maps: by userId (string UUID) and by normalized phone
  const normalizePhone = (p: string) => {
    if (!p) return "";
    const d = p.replace(/\D/g, "");
    if (d.startsWith("62")) return "0" + d.slice(2);
    return d.startsWith("0") ? d : d;
  };
  const userById = new Map<string, User>(users?.map(u => [String(u.id), u]) ?? []);
  const userByPhone = new Map<string, User>(users?.map(u => [normalizePhone(u.phoneNumber), u]) ?? []);

  const getUser = (tx: Transaction): User | undefined => {
    if (tx.userId != null) {
      const u = userById.get(String(tx.userId));
      if (u) return u;
    }
    return userByPhone.get(normalizePhone(tx.phoneNumber));
  };

  // Sync a single pending transaction with Midtrans (admin endpoint)
  const syncOneMutation = useMutation({
    mutationFn: async ({ transactionId }: { transactionId: string; transaction: Transaction }) => {
      return apiRequest(`/api/admin/transactions/${transactionId}/sync`, { method: "POST" });
    },
    onSuccess: (data: any, variables: { transactionId: string; transaction: Transaction }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      if (data?.newStatus === "paid") {
        toast({ title: "✅ Sudah Lunas — status diperbarui otomatis!" });
      } else if (data?.newStatus === "expired") {
        toast({ title: "⌛ Transaksi kadaluarsa — tidak ada pembayaran di Midtrans >24 jam" });
      } else if (data?.midtransStatus === "not_found") {
        // Show a dialog with Order ID + Midtrans dashboard link + confirm button
        setNotFoundTx(variables.transaction);
      } else if (!data?.success && data?.message?.includes("Could not reach")) {
        toast({ variant: "destructive", title: "❌ Gagal terhubung ke Midtrans — coba lagi nanti" });
      } else if (data?.midtransStatus === "pending") {
        toast({ title: "⏳ Midtrans: menunggu pembayaran — pembeli belum menyelesaikan" });
      } else {
        toast({ title: `Status Midtrans: ${data?.midtransStatus ?? data?.newStatus ?? "tidak diketahui"}` });
      }
    },
    onError: () => {
      toast({ variant: "destructive", title: "Gagal mengecek status ke Midtrans" });
    },
  });

  // Sync ALL pending transactions with Midtrans at once
  const syncAllMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("/api/admin/transactions/sync-pending", { method: "POST" });
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      toast({
        title: `✅ Sinkron selesai: ${data?.updated ?? 0} transaksi diperbarui dari ${data?.checked ?? 0} pending`,
      });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Gagal sinkron status dari Midtrans" });
    },
  });

  const deleteTransactionMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest(`/api/transactions/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      toast({
        title: "Berhasil",
        description: "Transaksi berhasil dihapus",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Gagal",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return apiRequest(`/api/transactions/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentStatus: status }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      toast({
        title: "Berhasil",
        description: "Status pembayaran berhasil diupdate",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Gagal",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const sendWaMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest(`/api/admin/transactions/${id}/send-wa`, { method: "POST" });
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      if (data?.success) {
        toast({ title: "✅ WA berhasil dikirim!", description: data?.message });
      } else {
        toast({ variant: "destructive", title: "❌ Gagal kirim WA", description: data?.message || "Cek konfigurasi Fonnte di Settings" });
      }
    },
    onError: () => {
      toast({ variant: "destructive", title: "❌ Gagal kirim WA", description: "Terjadi kesalahan server" });
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
            <CheckCircle className="w-3 h-3" /> Lunas
          </span>
        );
      case "pending":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-700">
            <Clock className="w-3 h-3" /> Pending
          </span>
        );
      case "failed":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">
            <XCircle className="w-3 h-3" /> Gagal
          </span>
        );
      case "expired":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700">
            <AlertCircle className="w-3 h-3" /> Expired
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-500">
            {status}
          </span>
        );
    }
  };

  const filteredTransactions = transactions?.filter(transaction => {
    const q = searchQuery.toLowerCase();
    if (!q) return true;
    const user = getUser(transaction);
    return (
      transaction.eventName.toLowerCase().includes(q) ||
      transaction.phoneNumber.toLowerCase().includes(q) ||
      (transaction.buyerName || user?.name || "").toLowerCase().includes(q) ||
      (transaction.buyerEmail || user?.email || "").toLowerCase().includes(q) ||
      (user?.city || "").toLowerCase().includes(q) ||
      (transaction.buyerIp || "").toLowerCase().includes(q)
    );
  }) || [];

  const totalRevenue = filteredTransactions.reduce((sum, t) => sum + t.amount, 0);
  const averageTransaction = filteredTransactions.length > 0
    ? totalRevenue / filteredTransactions.length
    : 0;

  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
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
        <AdminPageHeader 
            title="Daftar Transaksi"
            description="Riwayat seluruh transaksi pembelian tiket"
            breadcrumbs={[
              { label: "Home", href: "/admin-panel-7x9k/dashboard" },
              { label: "Transaksi" }
            ]}
          />

        <div className="flex-1 p-4 md:p-6 overflow-y-auto">
            <div className="space-y-6">
              {/* Statistics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                        <Receipt className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    <p className="text-blue-100 text-sm font-medium mb-1">Total Transaksi</p>
                    <h3 className="text-4xl font-bold">{filteredTransactions.length}</h3>
                    <div className="mt-3 h-1 bg-white/20 rounded-full overflow-hidden">
                      <div className="h-full bg-white/60 rounded-full" style={{ width: '100%' }}></div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br from-green-500 to-emerald-600 text-white">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                        <DollarSign className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    <p className="text-green-100 text-sm font-medium mb-1">Total Pendapatan</p>
                    <h3 className="text-3xl font-bold">Rp {totalRevenue.toLocaleString('id-ID')}</h3>
                    <div className="mt-3 h-1 bg-white/20 rounded-full overflow-hidden">
                      <div className="h-full bg-white/60 rounded-full" style={{ width: '100%' }}></div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br from-purple-500 to-pink-600 text-white">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                        <TrendingUp className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    <p className="text-purple-100 text-sm font-medium mb-1">Rata-rata Transaksi</p>
                    <h3 className="text-3xl font-bold">Rp {Math.round(averageTransaction).toLocaleString('id-ID')}</h3>
                    <div className="mt-3 h-1 bg-white/20 rounded-full overflow-hidden">
                      <div className="h-full bg-white/60 rounded-full" style={{ width: '75%' }}></div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Main Table Card */}
              <Card className="bg-white shadow-lg border-0 rounded-xl">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-xl">
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Receipt className="w-6 h-6" />
                    Daftar Transaksi
                  </h2>
                  <p className="text-blue-100 mt-1">Riwayat seluruh transaksi pembelian tiket</p>
                </div>

                <CardContent className="p-4">
                  <div className="flex flex-col gap-4 mb-4">
                    {/* Search Bar */}
                    <div className="flex flex-col md:flex-row items-center gap-3">
                      <div className="relative flex-1 w-full">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <Input
                          type="text"
                          placeholder="Cari nama, event, atau nomor telepon..."
                          value={searchQuery}
                          onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                          data-testid="input-search"
                          className="pl-12 h-12 border-2 border-gray-200 focus:border-purple-500 rounded-lg text-base"
                        />
                      </div>
                      <Button
                        onClick={() => syncAllMutation.mutate()}
                        disabled={syncAllMutation.isPending}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 h-12 rounded-lg shadow"
                      >
                        <RefreshCw className={`w-4 h-4 mr-2 ${syncAllMutation.isPending ? "animate-spin" : ""}`} />
                        {syncAllMutation.isPending ? "Sinkronisasi..." : "Sinkron Semua"}
                      </Button>
                      <div className="bg-gradient-to-r from-blue-50 to-purple-50 px-4 py-2 rounded-lg border border-purple-200 whitespace-nowrap">
                        <span className="text-sm font-semibold text-gray-700">
                          <span className="text-purple-600">{filteredTransactions.length}</span> transaksi ditemukan
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Table */}
                  <div className="rounded-xl border-2 border-gray-200">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-50">
                          <TableHead className="font-bold text-gray-700 w-8 px-2">No</TableHead>
                          <TableHead className="font-bold text-gray-700">Nama</TableHead>
                          <TableHead className="font-bold text-gray-700">ID Transaksi</TableHead>
                          <TableHead className="font-bold text-gray-700">Event</TableHead>
                          <TableHead className="font-bold text-gray-700">Waktu</TableHead>
                          <TableHead className="font-bold text-gray-700">No WA</TableHead>
                          <TableHead className="font-bold text-gray-700">No Rekening</TableHead>
                          <TableHead className="font-bold text-gray-700 text-center">Tiket</TableHead>
                          <TableHead className="font-bold text-gray-700">Total Rp</TableHead>
                          <TableHead className="font-bold text-gray-700 text-center">Undian</TableHead>
                          <TableHead className="font-bold text-gray-700">Status</TableHead>
                          <TableHead className="font-bold text-gray-700 text-center">WA</TableHead>
                          <TableHead className="font-bold text-gray-700 text-center">Aksi</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {isLoading ? (
                          <TableRow>
                            <TableCell colSpan={12} className="text-center py-12">
                              <div className="flex flex-col items-center gap-3">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                                <p className="text-gray-500 font-medium">Memuat data transaksi...</p>
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : paginatedTransactions.length > 0 ? (
                          paginatedTransactions.map((transaction, rowIndex) => {
                            const user = getUser(transaction);
                            const nama = transaction.buyerName || user?.name || "-";
                            const email = transaction.buyerEmail || user?.email || "-";
                            const kota = user?.city || "-";
                            const noRek = transaction.buyerAccountNumber || user?.accountNumber || null;
                            const bankName = transaction.buyerBankName || user?.bankName || null;
                            return (
                            <TableRow key={transaction.id} data-testid={`row-transaction-${transaction.id}`} className="hover:bg-purple-50/50 transition-colors">
                              {/* No */}
                              <TableCell className="py-1 px-2 text-center text-xs font-semibold text-gray-500">
                                {(currentPage - 1) * itemsPerPage + rowIndex + 1}
                              </TableCell>
                              {/* Nama */}
                              <TableCell className="py-2">
                                <span className="text-sm font-semibold text-gray-900">{nama}</span>
                              </TableCell>
                              {/* ID Transaksi */}
                              <TableCell className="py-2">
                                <div className="flex flex-col gap-1">
                                  <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded text-gray-700">
                                    {transaction.id.slice(0, 8)}...
                                  </span>
                                  <span className="font-mono text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded font-bold">
                                    UND-{transaction.id.slice(0, 8).toUpperCase()}
                                  </span>
                                </div>
                              </TableCell>
                              {/* Event */}
                              <TableCell className="py-2">
                                <div className="text-xs font-semibold text-gray-900 flex items-center gap-1.5">
                                  <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex-shrink-0"></div>
                                  <span className="line-clamp-2 max-w-[120px]">{transaction.eventName}</span>
                                </div>
                              </TableCell>
                              {/* Waktu Transaksi */}
                              <TableCell className="py-2">
                                <div className="flex flex-col gap-0.5">
                                  <span className="text-xs font-medium text-gray-700">
                                    {new Date(transaction.createdAt).toLocaleDateString('id-ID', {
                                      day: '2-digit', month: 'short', year: 'numeric'
                                    })}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {new Date(transaction.createdAt).toLocaleTimeString('id-ID', {
                                      hour: '2-digit', minute: '2-digit'
                                    })}
                                  </span>
                                </div>
                              </TableCell>
                              {/* No WA */}
                              <TableCell className="py-2">
                                <span className="font-mono bg-blue-50 text-blue-700 px-2 py-1 rounded-full text-xs font-medium">
                                  {transaction.phoneNumber}
                                </span>
                              </TableCell>
                              {/* No Rekening */}
                              <TableCell className="py-2">
                                <div className="flex flex-col text-xs">
                                  {noRek ? (
                                    <>
                                      <span className="font-mono bg-gray-100 px-2 py-0.5 rounded text-gray-700">{noRek}</span>
                                      {bankName && <span className="text-gray-500 mt-0.5">{bankName}</span>}
                                    </>
                                  ) : (
                                    <span className="text-gray-400">-</span>
                                  )}
                                </div>
                              </TableCell>
                              {/* Total Tiket */}
                              <TableCell className="py-2 text-center">
                                <span className="inline-flex items-center justify-center bg-purple-100 text-purple-700 font-bold text-sm rounded-full w-8 h-8">
                                  {transaction.ticketCount ?? 1}
                                </span>
                              </TableCell>
                              {/* Total Rp */}
                              <TableCell className="py-2">
                                <span className="inline-flex items-center gap-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-2 py-1 rounded-full text-xs font-bold shadow-sm whitespace-nowrap">
                                  {new Intl.NumberFormat("id-ID").format(transaction.amount)}
                                </span>
                              </TableCell>
                              {/* Nomor Undian */}
                              <TableCell className="py-2 text-center">
                                <div className="flex flex-col items-center gap-0.5">
                                  <span className="font-mono text-xs font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
                                    UND-{transaction.id.slice(0, 8).toUpperCase()}
                                  </span>
                                  {transaction.undianType && (
                                    <span
                                      className="inline-block text-xs font-bold px-1.5 py-0.5 rounded-full text-white"
                                      style={{
                                        background: transaction.undianType === "A"
                                          ? "linear-gradient(135deg,#7c3aed,#4f46e5)"
                                          : "linear-gradient(135deg,#db2777,#9333ea)"
                                      }}
                                    >
                                      {transaction.undianType}
                                    </span>
                                  )}
                                </div>
                              </TableCell>
                              {/* Status Pembayaran */}
                              <TableCell className="py-2">
                                {getStatusBadge(transaction.paymentStatus)}
                              </TableCell>
                              {/* Status WA Fonnte */}
                              <TableCell className="py-2 text-center">
                                {transaction.waSentAt ? (
                                  <div className="flex flex-col items-center gap-0.5">
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-700">
                                      <MessageCircle className="w-3 h-3" /> Terkirim
                                    </span>
                                    <span className="text-xs text-gray-400">
                                      {new Date(transaction.waSentAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                  </div>
                                ) : transaction.paymentStatus === "paid" ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700">
                                    <MessageCircle className="w-3 h-3" /> Belum
                                  </span>
                                ) : (
                                  <span className="text-gray-300 text-xs">-</span>
                                )}
                              </TableCell>
                              <TableCell className="text-center">
                                <div className="flex items-center justify-center gap-1">
                                  {transaction.paymentStatus === "pending" && (
                                    <>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => syncOneMutation.mutate({ transactionId: transaction.id, transaction })}
                                        disabled={syncOneMutation.isPending}
                                        className="bg-blue-500 text-white border-0 hover:bg-blue-600 shadow-md text-xs px-2"
                                        title="Cek status ke Midtrans dan perbarui otomatis"
                                      >
                                        <RefreshCw className="w-3 h-3 mr-1" />
                                        Cek
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => updateStatusMutation.mutate({ id: transaction.id, status: "paid" })}
                                        disabled={updateStatusMutation.isPending}
                                        className="bg-green-500 text-white border-0 hover:bg-green-600 shadow-md text-xs px-2"
                                        title="Konfirmasi lunas secara manual"
                                      >
                                        <CheckCircle className="w-3 h-3 mr-1" />
                                        Konfirmasi
                                      </Button>
                                    </>
                                  )}
                                  {transaction.paymentStatus === "paid" && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => sendWaMutation.mutate(transaction.id)}
                                      disabled={sendWaMutation.isPending}
                                      className="bg-green-600 text-white border-0 hover:bg-green-700 shadow-md text-xs px-2"
                                      title="Kirim nomor undian via WhatsApp"
                                    >
                                      <Send className="w-3 h-3 mr-1" />
                                      WA
                                    </Button>
                                  )}
                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0 hover:from-blue-600 hover:to-purple-700 shadow-md text-xs px-2"
                                      >
                                        <Eye className="w-3 h-3" />
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
                                      <DialogHeader>
                                        <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                          Detail Transaksi
                                        </DialogTitle>
                                      </DialogHeader>
                                      <div className="space-y-4 mt-4 overflow-y-auto pr-1">
                                        <div className="bg-gradient-to-r from-purple-500 to-indigo-600 p-4 rounded-lg text-white">
                                          <p className="text-sm text-purple-100 font-medium mb-1">Nomor Undian</p>
                                          <p className="font-mono text-2xl font-bold tracking-wider">
                                            UND-{transaction.id.slice(0, 8).toUpperCase()}
                                          </p>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                          <div className="bg-gray-50 p-4 rounded-lg">
                                            <p className="text-sm text-gray-500 font-medium mb-1">ID Transaksi</p>
                                            <p className="font-mono text-sm text-gray-900 bg-white px-3 py-2 rounded border border-gray-200">
                                              {transaction.id}
                                            </p>
                                          </div>
                                          <div className="bg-gray-50 p-4 rounded-lg">
                                            <p className="text-sm text-gray-500 font-medium mb-1">Status Pembayaran</p>
                                            <div className="mt-1">{getStatusBadge(transaction.paymentStatus)}</div>
                                          </div>
                                        </div>

                                        <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-200">
                                          <p className="text-sm text-gray-500 font-medium mb-1">Nama Event</p>
                                          <p className="text-lg font-bold text-gray-900">{transaction.eventName}</p>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                          <div className="bg-gray-50 p-4 rounded-lg">
                                            <p className="text-sm text-gray-500 font-medium mb-1">Nomor Telepon</p>
                                            <p className="font-mono text-base font-semibold text-gray-900">
                                              {transaction.phoneNumber}
                                            </p>
                                          </div>
                                          <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-4 rounded-lg text-white">
                                            <p className="text-sm text-green-100 font-medium mb-1">Total Pembayaran</p>
                                            <p className="text-2xl font-bold">
                                              Rp {transaction.amount.toLocaleString('id-ID')}
                                            </p>
                                          </div>
                                        </div>

                                        {/* Email & Kota */}
                                        <div className="grid grid-cols-2 gap-4">
                                          <div className="bg-gray-50 p-4 rounded-lg">
                                            <p className="text-sm text-gray-500 font-medium mb-1">Email</p>
                                            <p className="text-sm text-gray-900 break-all">{email}</p>
                                          </div>
                                          <div className="bg-gray-50 p-4 rounded-lg">
                                            <p className="text-sm text-gray-500 font-medium mb-1">Kota</p>
                                            <p className="text-sm text-gray-900">{kota}</p>
                                          </div>
                                        </div>

                                        {/* Payment Method Info */}
                                        <div className="grid grid-cols-2 gap-4">
                                          <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
                                            <p className="text-sm text-indigo-600 font-medium mb-1">Metode Pembayaran</p>
                                            <p className="font-semibold text-gray-900">
                                              {transaction.paymentChannel || transaction.paymentMethod || '-'}
                                            </p>
                                          </div>
                                          <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
                                            <p className="text-sm text-indigo-600 font-medium mb-1">Nomor Pembayaran / VA</p>
                                            <p className="font-mono text-base font-semibold text-gray-900">
                                              {transaction.paymentNumber || '-'}
                                            </p>
                                          </div>
                                        </div>

                                        {/* IP & Event ID */}
                                        <div className="grid grid-cols-2 gap-4">
                                          <div className="bg-gray-50 p-4 rounded-lg">
                                            <p className="text-sm text-gray-500 font-medium mb-1">IP Address Pembeli</p>
                                            <p className="font-mono text-sm text-gray-900 bg-white px-3 py-2 rounded border border-gray-200">
                                              {transaction.buyerIp || "-"}
                                            </p>
                                          </div>
                                          <div className="bg-gray-50 p-4 rounded-lg">
                                            <p className="text-sm text-gray-500 font-medium mb-1">Event ID</p>
                                            <p className="font-mono text-xs text-gray-700 bg-white px-3 py-2 rounded border border-gray-200 break-all">
                                              {transaction.eventId}
                                            </p>
                                          </div>
                                        </div>

                                        <div className="bg-gray-50 p-4 rounded-lg">
                                          <p className="text-sm text-gray-500 font-medium mb-1">Waktu Transaksi</p>
                                          <div className="flex items-center gap-2 text-gray-900">
                                            <Calendar className="w-4 h-4 text-gray-500" />
                                            <span className="font-semibold">
                                              {new Date(transaction.createdAt).toLocaleDateString('id-ID', {
                                                weekday: 'long',
                                                day: '2-digit',
                                                month: 'long',
                                                year: 'numeric'
                                              })}
                                            </span>
                                            <span className="text-gray-400">•</span>
                                            <span className="font-semibold">
                                              {new Date(transaction.createdAt).toLocaleTimeString('id-ID', {
                                                hour: '2-digit',
                                                minute: '2-digit',
                                                second: '2-digit'
                                              })} WIB
                                            </span>
                                          </div>
                                        </div>

                                        {/* Data Rekening Pembeli */}
                                        {(transaction.buyerBankName || transaction.buyerAccountNumber) && (
                                          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                            <p className="text-sm text-blue-800 font-medium mb-3">Data Rekening Pemenang:</p>
                                            <div className="grid grid-cols-2 gap-3">
                                              <div>
                                                <p className="text-xs text-blue-600 font-medium mb-1">Nama Bank</p>
                                                <p className="font-semibold text-gray-900">{transaction.buyerBankName || "-"}</p>
                                              </div>
                                              <div>
                                                <p className="text-xs text-blue-600 font-medium mb-1">Nomor Rekening</p>
                                                <p className="font-mono font-semibold text-gray-900">{transaction.buyerAccountNumber || "-"}</p>
                                              </div>
                                            </div>
                                          </div>
                                        )}
                                        {!transaction.buyerBankName && !transaction.buyerAccountNumber && (
                                          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                            <p className="text-sm text-gray-500 font-medium">Data Rekening Pemenang: <span className="text-gray-400 font-normal">Belum diisi oleh pembeli</span></p>
                                          </div>
                                        )}

                                        {/* WA Fonnte Status */}
                                        <div className={`p-4 rounded-lg border ${transaction.waSentAt ? "bg-green-50 border-green-200" : "bg-orange-50 border-orange-200"}`}>
                                          <div className="flex items-center justify-between mb-2">
                                            <p className={`text-sm font-medium ${transaction.waSentAt ? "text-green-800" : "text-orange-800"}`}>
                                              Status Pengiriman WA (Fonnte):
                                            </p>
                                            {transaction.paymentStatus === "paid" && (
                                              <Button
                                                size="sm"
                                                onClick={() => sendWaMutation.mutate(transaction.id)}
                                                disabled={sendWaMutation.isPending}
                                                className="bg-green-600 hover:bg-green-700 text-white text-xs"
                                              >
                                                <Send className="w-3 h-3 mr-1" />
                                                {sendWaMutation.isPending ? "Mengirim..." : transaction.waSentAt ? "Kirim Ulang" : "Kirim WA"}
                                              </Button>
                                            )}
                                          </div>
                                          {transaction.waSentAt ? (
                                            <div className="flex items-center gap-2">
                                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-green-200 text-green-800">
                                                <MessageCircle className="w-3 h-3" /> Terkirim
                                              </span>
                                              <span className="text-sm text-green-700 font-medium">
                                                {new Date(transaction.waSentAt).toLocaleString('id-ID', {
                                                  day: '2-digit', month: 'short', year: 'numeric',
                                                  hour: '2-digit', minute: '2-digit', second: '2-digit'
                                                })} WIB
                                              </span>
                                            </div>
                                          ) : (
                                            <p className="text-sm text-orange-700">
                                              {transaction.paymentStatus === "paid"
                                                ? "⚠️ WA belum terkirim ke nomor ini. Klik tombol Kirim WA untuk mengirim sekarang."
                                                : "WA hanya dikirim untuk transaksi yang sudah Lunas."}
                                            </p>
                                          )}
                                        </div>

                                        {/* Manual status update buttons */}
                                        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                                          <p className="text-sm text-yellow-800 font-medium mb-3">Update Status Pembayaran Manual:</p>
                                          <div className="flex flex-wrap gap-2">
                                            <Button
                                              size="sm"
                                              onClick={() => updateStatusMutation.mutate({ id: transaction.id, status: "paid" })}
                                              disabled={updateStatusMutation.isPending || transaction.paymentStatus === "paid"}
                                              className="bg-green-500 hover:bg-green-600 text-white"
                                            >
                                              <CheckCircle className="w-4 h-4 mr-1" /> Konfirmasi Lunas
                                            </Button>
                                            <Button
                                              size="sm"
                                              onClick={() => updateStatusMutation.mutate({ id: transaction.id, status: "pending" })}
                                              disabled={updateStatusMutation.isPending || transaction.paymentStatus === "pending"}
                                              className="bg-yellow-500 hover:bg-yellow-600 text-white"
                                            >
                                              <Clock className="w-4 h-4 mr-1" /> Set Pending
                                            </Button>
                                            <Button
                                              size="sm"
                                              onClick={() => updateStatusMutation.mutate({ id: transaction.id, status: "failed" })}
                                              disabled={updateStatusMutation.isPending || transaction.paymentStatus === "failed"}
                                              className="bg-red-500 hover:bg-red-600 text-white"
                                            >
                                              <XCircle className="w-4 h-4 mr-1" /> Set Gagal
                                            </Button>
                                          </div>
                                        </div>
                                      </div>
                                    </DialogContent>
                                  </Dialog>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="bg-red-500 text-white border-0 hover:bg-red-600 shadow-md text-xs px-2"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Hapus Transaksi?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Apakah Anda yakin ingin menghapus transaksi ini?
                                          Tindakan ini tidak dapat dibatalkan.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Batal</AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() => deleteTransactionMutation.mutate(transaction.id)}
                                          className="bg-red-500 hover:bg-red-600"
                                        >
                                          Hapus
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                          })
                        ) : (
                          <TableRow>
                            <TableCell colSpan={12} className="text-center py-12">
                              <div className="flex flex-col items-center gap-3">
                                <div className="bg-gray-100 rounded-full p-4">
                                  <Receipt className="w-12 h-12 text-gray-400" />
                                </div>
                                <div>
                                  <p className="text-gray-900 font-semibold text-lg">
                                    {searchQuery ? "Tidak ada transaksi ditemukan" : "Belum ada transaksi"}
                                  </p>
                                  <p className="text-sm text-gray-500 mt-1">
                                    {searchQuery ? "Coba kata kunci lain" : "Transaksi akan muncul di sini setelah ada pembelian tiket"}
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Pagination Footer */}
                  {totalPages > 0 && (
                    <div className="flex flex-col md:flex-row items-center justify-between mt-6 gap-4">
                      <span className="text-sm font-medium text-gray-600 bg-white px-3 py-1 rounded-full border border-gray-200">
                        Menampilkan{" "}
                        <span className="font-bold text-purple-600">
                          {paginatedTransactions.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}
                        </span>{" "}
                        -{" "}
                        <span className="font-bold text-purple-600">
                          {Math.min(currentPage * itemsPerPage, filteredTransactions.length)}
                        </span>{" "}
                        dari{" "}
                        <span className="font-bold text-blue-600">{filteredTransactions.length}</span> transaksi
                      </span>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                          className="h-9 px-3 rounded-lg border-2"
                        >
                          ‹ Prev
                        </Button>

                        {getPageNumbers().map((page, i) =>
                          page === "..." ? (
                            <span key={`ellipsis-${i}`} className="px-2 text-gray-400">...</span>
                          ) : (
                            <Button
                              key={page}
                              variant={currentPage === page ? "default" : "outline"}
                              size="sm"
                              onClick={() => setCurrentPage(page as number)}
                              className={`h-9 w-9 rounded-lg border-2 ${
                                currentPage === page
                                  ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white border-transparent"
                                  : "hover:border-purple-400"
                              }`}
                            >
                              {page}
                            </Button>
                          )
                        )}

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                          disabled={currentPage === totalPages}
                          className="h-9 px-3 rounded-lg border-2"
                        >
                          Next ›
                        </Button>

                        <Select
                          value={String(itemsPerPage)}
                          onValueChange={(v) => { setItemsPerPage(Number(v)); setCurrentPage(1); }}
                        >
                          <SelectTrigger className="h-9 w-[90px] rounded-lg border-2">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="10">10 / hal</SelectItem>
                            <SelectItem value="25">25 / hal</SelectItem>
                            <SelectItem value="50">50 / hal</SelectItem>
                            <SelectItem value="100">100 / hal</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
          </div>
        </div>
      </div>

      {/* Dialog: "Tidak ditemukan di Midtrans" — show Order ID + confirm button */}
      {notFoundTx && (
        <Dialog open={!!notFoundTx} onOpenChange={(open) => { if (!open) setNotFoundTx(null); }}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-orange-600">
                <AlertCircle className="w-5 h-5" />
                Tidak Ditemukan di Midtrans
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <p className="text-sm text-gray-700">
                Pembayaran atas nama <strong>{notFoundTx.buyerName || notFoundTx.phoneNumber}</strong> tidak ditemukan di sistem Midtrans.
                Ini bisa terjadi karena webhook Midtrans tidak sampai ke server kami.
              </p>

              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 space-y-2">
                <p className="text-xs font-semibold text-orange-800 uppercase tracking-wide">Order ID Midtrans (untuk dicek manual):</p>
                <div className="flex items-center gap-2">
                  <code className="text-sm font-mono bg-white border rounded px-2 py-1 flex-1 break-all select-all">
                    {notFoundTx.id}
                  </code>
                  <Button
                    size="sm"
                    variant="outline"
                    className="shrink-0"
                    onClick={() => {
                      navigator.clipboard.writeText(notFoundTx.id);
                      toast({ title: "✅ Order ID disalin!" });
                    }}
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800 space-y-1">
                <p className="font-semibold">Langkah yang disarankan:</p>
                <ol className="list-decimal list-inside space-y-1 text-xs">
                  <li>Buka dashboard Midtrans → cari Order ID di atas</li>
                  <li>Jika status di Midtrans <strong>Settlement/Lunas</strong> → klik "Konfirmasi Lunas" di bawah</li>
                  <li>Jika tidak ada di Midtrans → pembeli mungkin belum selesai bayar</li>
                </ol>
              </div>

              <a
                href="https://dashboard.midtrans.com/transactions"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
              >
                <ExternalLink className="w-4 h-4" />
                Buka Dashboard Midtrans
              </a>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                onClick={() => {
                  updateStatusMutation.mutate({ id: notFoundTx.id, status: "paid" });
                  setNotFoundTx(null);
                }}
                disabled={updateStatusMutation.isPending}
              >
                <CheckCircle className="w-4 h-4 mr-1" />
                Konfirmasi Lunas (Manual)
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setNotFoundTx(null)}
              >
                Tutup
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </SidebarProvider>
  );
}
