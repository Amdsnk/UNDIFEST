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
import { Search, DollarSign, TrendingUp, Calendar, Receipt, Eye, Trash2, CheckCircle, Clock, XCircle, AlertCircle, RefreshCw } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Transaction } from "@shared/schema";

export default function TransactionsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: transactions, isLoading } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
  });

  // Sync a single pending transaction with Midtrans
  const syncOneMutation = useMutation({
    mutationFn: async (transactionId: string) => {
      return apiRequest(`/api/payments/status/${transactionId}`);
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      if (data?.paymentStatus === "paid") {
        toast({ title: "✅ Sudah Lunas — status diperbarui otomatis!" });
      } else if (data?.paymentStatus === "expired") {
        toast({ title: "⌛ Transaksi kadaluarsa — tidak ada pembayaran di Midtrans >24 jam" });
      } else if (data?.midtransRawStatus === "not_found") {
        toast({ title: "⚠️ Tidak ditemukan di Midtrans — pembeli belum menyelesaikan pembayaran" });
      } else if (data?.midtransRawStatus === "api_error") {
        toast({ variant: "destructive", title: "❌ Gagal terhubung ke Midtrans — coba lagi nanti" });
      } else if (data?.midtransRawStatus === "not_checked") {
        toast({ title: "ℹ️ Transaksi belum mencapai tahap pembayaran Midtrans" });
      } else if (data?.midtransRawStatus === "pending") {
        toast({ title: "⏳ Midtrans: menunggu pembayaran — pembeli belum menyelesaikan" });
      } else {
        toast({ title: `Status Midtrans: ${data?.midtransRawStatus ?? data?.paymentStatus ?? "tidak diketahui"}` });
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

  const filteredTransactions = transactions?.filter(transaction =>
    transaction.eventName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    transaction.phoneNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (transaction.buyerIp || "").toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const totalRevenue = filteredTransactions.reduce((sum, t) => sum + t.amount, 0);
  const averageTransaction = filteredTransactions.length > 0
    ? totalRevenue / filteredTransactions.length
    : 0;

  return (
    <SidebarProvider>
      <AdminSidebar />
      <div className="flex flex-col flex-1 min-h-screen admin-light bg-gray-50">
        <AdminPageHeader 
            title="Daftar Transaksi"
            description="Riwayat seluruh transaksi pembelian tiket"
            breadcrumbs={[
              { label: "Home", href: "/admin-panel-7x9k/dashboard" },
              { label: "Transaksi" }
            ]}
          />

        <div className="flex-1 p-8 overflow-y-auto">
            <div className="max-w-7xl mx-auto space-y-6">
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
              <Card className="border-0 shadow-lg">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-xl">
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Receipt className="w-6 h-6" />
                    Daftar Transaksi
                  </h2>
                  <p className="text-blue-100 mt-1">Riwayat seluruh transaksi pembelian tiket</p>
                </div>

                <CardContent className="p-0">
                  {/* Search Bar */}
                  <div className="flex flex-col md:flex-row items-center gap-4 mb-6 px-6 pt-6">
                    <div className="relative flex-1 w-full">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input
                        type="text"
                        placeholder="Cari event atau nomor telepon..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        data-testid="input-search"
                        className="pl-12 h-12 border-2 border-gray-200 focus:border-purple-400 focus:ring-purple-400 rounded-xl text-base"
                      />
                    </div>
                    <Button
                      onClick={() => syncAllMutation.mutate()}
                      disabled={syncAllMutation.isPending}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 h-12 rounded-xl shadow"
                    >
                      <RefreshCw className={`w-4 h-4 mr-2 ${syncAllMutation.isPending ? "animate-spin" : ""}`} />
                      {syncAllMutation.isPending ? "Sinkronisasi..." : "Sinkron Semua"}
                    </Button>
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 px-4 py-2 rounded-xl border border-purple-200">
                      <span className="text-sm font-semibold text-gray-700">
                        <span className="text-purple-600">{filteredTransactions.length}</span> transaksi ditemukan
                      </span>
                    </div>
                  </div>

                  {/* Table */}
                  <div className="overflow-x-auto rounded-xl border border-gray-200 mx-6 mb-6">
                    <Table className="min-w-[950px]">
                      <TableHeader>
                        <TableRow className="bg-gradient-to-r from-gray-50 to-purple-50 hover:from-gray-100 hover:to-purple-100">
                          <TableHead className="font-bold text-gray-700">ID Transaksi</TableHead>
                          <TableHead className="font-bold text-gray-700">Event</TableHead>
                          <TableHead className="font-bold text-gray-700">Nomor Telepon</TableHead>
                          <TableHead className="font-bold text-gray-700">Jumlah</TableHead>
                          <TableHead className="font-bold text-gray-700">Status</TableHead>
                          <TableHead className="font-bold text-gray-700">IP</TableHead>
                          <TableHead className="font-bold text-gray-700">Tanggal</TableHead>
                          <TableHead className="font-bold text-gray-700 text-center">Aksi</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {isLoading ? (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center py-12">
                              <div className="flex flex-col items-center gap-3">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                                <p className="text-gray-500 font-medium">Memuat data transaksi...</p>
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : filteredTransactions.length > 0 ? (
                          filteredTransactions.map((transaction) => (
                            <TableRow key={transaction.id} data-testid={`row-transaction-${transaction.id}`} className="hover:bg-purple-50/50 transition-colors">
                              <TableCell className="py-3">
                                <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded text-gray-700">
                                  {transaction.id.slice(0, 8)}...
                                </span>
                              </TableCell>
                              <TableCell className="py-3">
                                <div className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
                                  <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-blue-500 to-purple-600"></div>
                                  {transaction.eventName}
                                </div>
                              </TableCell>
                              <TableCell className="py-3">
                                <span className="font-mono bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full text-xs font-medium">
                                  {transaction.phoneNumber}
                                </span>
                              </TableCell>
                              <TableCell className="py-3">
                                <span className="inline-flex items-center gap-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-3 py-1.5 rounded-full text-sm font-bold shadow-md whitespace-nowrap">
                                  Rp {transaction.amount.toLocaleString('id-ID')}
                                </span>
                              </TableCell>
                              <TableCell className="py-3">
                                {getStatusBadge(transaction.paymentStatus)}
                              </TableCell>
                              <TableCell className="py-3">
                                <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">
                                  {transaction.buyerIp || "-"}
                                </span>
                              </TableCell>
                              <TableCell className="py-3">
                                <div className="flex flex-col gap-0.5">
                                  <span className="text-xs font-medium text-gray-700">
                                    {new Date(transaction.createdAt).toLocaleDateString('id-ID', {
                                      day: '2-digit',
                                      month: 'short',
                                      year: 'numeric'
                                    })}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {new Date(transaction.createdAt).toLocaleTimeString('id-ID', {
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className="text-center">
                                <div className="flex items-center justify-center gap-1">
                                  {transaction.paymentStatus === "pending" && (
                                    <>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => syncOneMutation.mutate(transaction.id)}
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
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center py-12">
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
                </CardContent>
              </Card>
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
}
