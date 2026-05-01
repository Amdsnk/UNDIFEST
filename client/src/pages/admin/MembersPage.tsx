import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminSidebar } from "@/components/AdminSidebar";
import { AdminPageHeader } from "@/components/AdminPageHeader";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Search, Users, ShoppingCart, Calendar, Trash2, CheckCircle, XCircle, UserX } from "lucide-react";
import { useState } from "react";
import type { User, Transaction } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

export default function MembersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const { data: transactions } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest(`/api/users/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ title: "Member berhasil dihapus" });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Gagal menghapus member" });
    },
  });

  // Sync a single transaction status with Midtrans
  const syncOneMutation = useMutation({
    mutationFn: async (transactionId: string) => {
      // Re-use the public payment status endpoint — it already calls Midtrans and updates DB
      return apiRequest(`/api/payments/status/${transactionId}`);
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      if (data?.paymentStatus === "paid") {
        toast({ title: "✅ Sudah Lunas — status diperbarui otomatis!" });
      } else {
        toast({ title: `Status: ${data?.paymentStatus ?? "tidak diketahui"}` });
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

  const handleDelete = (id: string, phoneNumber: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus member ${phoneNumber}?`)) {
      deleteMutation.mutate(id);
    }
  };

  const filteredUsers = users?.filter(user =>
    user.phoneNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (user.name && user.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (user.email && user.email.toLowerCase().includes(searchQuery.toLowerCase()))
  ) || [];

  const getUserTransactionCount = (userId: string, phoneNumber: string) => {
    return transactions?.filter(
      (t) => t.paymentStatus === "paid" && (t.userId === userId || t.phoneNumber === phoneNumber)
    ).length || 0;
  };

  const isProfileComplete = (user: User) => {
    return user.name && user.email && user.city && user.bankName && user.accountNumber;
  };

  // Guest buyers: ALL transactions where userId is null (including pending QRIS)
  const guestBuyers = transactions?.filter(
    (t) => !t.userId
  ) || [];

  return (
    <SidebarProvider>
      <AdminSidebar />
      <div className="flex flex-col flex-1 min-h-screen admin-light bg-gray-50">
        <AdminPageHeader 
            title="Member"
            description="Daftar member yang terdaftar di platform"
            breadcrumbs={[
              { label: "Home", href: "/admin-panel-7x9k/dashboard" },
              { label: "Member" }
            ]}
          />

        <div className="flex-1 p-4 md:p-6 overflow-y-auto">
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-600 to-purple-600 text-white">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                        <Users className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    <p className="text-white/80 text-sm mb-1">Total Member</p>
                    <h3 className="text-4xl font-bold">{users?.length || 0}</h3>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="p-3 bg-green-100 rounded-xl">
                        <ShoppingCart className="w-6 h-6 text-green-600" />
                      </div>
                    </div>
                    <p className="text-gray-600 text-sm mb-1">Total Transaksi</p>
                    <h3 className="text-4xl font-bold text-gray-900">{transactions?.length || 0}</h3>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="p-3 bg-amber-100 rounded-xl">
                        <Calendar className="w-6 h-6 text-amber-600" />
                      </div>
                    </div>
                    <p className="text-gray-600 text-sm mb-1">Rata-rata Transaksi/Member</p>
                    <h3 className="text-4xl font-bold text-gray-900">
                      {users && users.length > 0 && transactions
                        ? Math.round(transactions.length / users.length)
                        : 0}
                    </h3>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="p-3 bg-orange-100 rounded-xl">
                        <UserX className="w-6 h-6 text-orange-600" />
                      </div>
                    </div>
                    <p className="text-gray-600 text-sm mb-1">Guest Buyers</p>
                    <h3 className="text-4xl font-bold text-gray-900">{guestBuyers.length}</h3>
                  </CardContent>
                </Card>
              </div>

              <Card className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="relative flex-1 max-w-md">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input
                        type="text"
                        placeholder="Cari nomor telepon..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        data-testid="input-search"
                        className="pl-10 h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    <div className="text-sm text-gray-600">
                      {filteredUsers.length} member ditemukan
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50 hover:bg-gray-50">
                          <TableHead className="font-semibold text-gray-900">No</TableHead>
                          <TableHead className="font-semibold text-gray-900">Nomor Telepon</TableHead>
                          <TableHead className="font-semibold text-gray-900">Nama</TableHead>
                          <TableHead className="font-semibold text-gray-900">Email</TableHead>
                          <TableHead className="font-semibold text-gray-900">Kota</TableHead>
                          <TableHead className="font-semibold text-gray-900">Bank</TableHead>
                          <TableHead className="font-semibold text-gray-900">No. Rekening</TableHead>
                          <TableHead className="font-semibold text-gray-900">Profile</TableHead>
                          <TableHead className="font-semibold text-gray-900">Transaksi</TableHead>
                          <TableHead className="font-semibold text-gray-900">Tgl Gabung</TableHead>
                          <TableHead className="font-semibold text-gray-900 text-right">Aksi</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {isLoading ? (
                          <TableRow>
                            <TableCell colSpan={11} className="text-center py-12">
                              <div className="flex items-center justify-center gap-3">
                                <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                <span className="text-gray-600">Memuat data...</span>
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : filteredUsers.length > 0 ? (
                          filteredUsers.map((user, index) => (
                            <TableRow key={user.id} data-testid={`row-user-${user.id}`} className="hover:bg-gray-50 transition-colors">
                              <TableCell className="font-medium text-gray-900">{index + 1}</TableCell>
                              <TableCell className="font-semibold text-gray-900">{user.phoneNumber}</TableCell>
                              <TableCell className="text-gray-700">{user.name || "-"}</TableCell>
                              <TableCell className="text-gray-700">{user.email || "-"}</TableCell>
                              <TableCell className="text-gray-700">{user.city || "-"}</TableCell>
                              <TableCell className="text-gray-700">{user.bankName || "-"}</TableCell>
                              <TableCell className="text-gray-700">{user.accountNumber || "-"}</TableCell>
                              <TableCell>
                                {isProfileComplete(user) ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                                    <CheckCircle className="w-3 h-3" />
                                    Lengkap
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold">
                                    <XCircle className="w-3 h-3" />
                                    Belum
                                  </span>
                                )}
                              </TableCell>
                              <TableCell>
                                <span className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-semibold">
                                  <ShoppingCart className="w-4 h-4" />
                                  {getUserTransactionCount(user.id, user.phoneNumber)}
                                </span>
                              </TableCell>
                              <TableCell className="text-gray-600 text-sm">
                                {new Date(user.createdAt).toLocaleDateString('id-ID', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric'
                                })}
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDelete(user.id, user.phoneNumber)}
                                  className="text-red-600 hover:text-red-800 hover:bg-red-50"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={11} className="text-center py-12">
                              <div className="flex flex-col items-center gap-3">
                                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
                                  <Users className="w-8 h-8 text-gray-400" />
                                </div>
                                <div>
                                  <p className="text-gray-900 font-semibold">
                                    {searchQuery ? "Tidak ada member ditemukan" : "Belum ada member"}
                                  </p>
                                  <p className="text-sm text-gray-500 mt-1">
                                    {searchQuery ? "Coba kata kunci lain" : "Member akan muncul setelah melakukan transaksi"}
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

              {/* Guest Buyers Section */}
              <Card className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <UserX className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">Guest Buyers</h2>
                      <p className="text-sm text-gray-500">Pembeli yang tidak login saat melakukan transaksi</p>
                    </div>
                    <div className="ml-auto flex items-center gap-3">
                      <span className="text-sm text-gray-600">{guestBuyers.length} pembeli</span>
                      <Button
                        size="sm"
                        onClick={() => syncAllMutation.mutate()}
                        disabled={syncAllMutation.isPending}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-3 py-1"
                      >
                        <CheckCircle className="w-3 h-3 mr-1" />
                        {syncAllMutation.isPending ? "Mengecek..." : "Sinkron Status Midtrans"}
                      </Button>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50 hover:bg-gray-50">
                          <TableHead className="font-semibold text-gray-900">No</TableHead>
                          <TableHead className="font-semibold text-gray-900">Nama</TableHead>
                          <TableHead className="font-semibold text-gray-900">Nomor Telepon</TableHead>
                          <TableHead className="font-semibold text-gray-900">Email</TableHead>
                          <TableHead className="font-semibold text-gray-900">Bank</TableHead>
                          <TableHead className="font-semibold text-gray-900">No. Rekening</TableHead>
                          <TableHead className="font-semibold text-gray-900">Event</TableHead>
                          <TableHead className="font-semibold text-gray-900">Jumlah Tiket</TableHead>
                          <TableHead className="font-semibold text-gray-900">Total Bayar</TableHead>
                          <TableHead className="font-semibold text-gray-900">Status</TableHead>
                          <TableHead className="font-semibold text-gray-900">Tanggal</TableHead>
                          <TableHead className="font-semibold text-gray-900">Aksi</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {guestBuyers.length > 0 ? (
                          guestBuyers.map((t, index) => (
                            <TableRow key={t.id} className="hover:bg-gray-50 transition-colors">
                              <TableCell className="font-medium text-gray-900">{index + 1}</TableCell>
                              <TableCell className="text-gray-700">{t.buyerName || "-"}</TableCell>
                              <TableCell className="font-semibold text-gray-900">{t.phoneNumber}</TableCell>
                              <TableCell className="text-gray-700">{t.buyerEmail || "-"}</TableCell>
                              <TableCell className="font-medium text-gray-700">{t.buyerBankName || "-"}</TableCell>
                              <TableCell>
                                <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded text-gray-700">{t.buyerAccountNumber || "-"}</span>
                              </TableCell>
                              <TableCell className="text-gray-700">{t.eventName}</TableCell>
                              <TableCell>
                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold">
                                  {t.ticketCount} tiket
                                </span>
                              </TableCell>
                              <TableCell className="font-semibold text-gray-900">
                                Rp {t.amount.toLocaleString('id-ID')}
                              </TableCell>
                              <TableCell>
                                {t.paymentStatus === "paid" ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                                    <CheckCircle className="w-3 h-3" /> Lunas
                                  </span>
                                ) : t.paymentStatus === "pending" ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700">
                                    ⏳ Pending
                                  </span>
                                ) : t.paymentStatus === "expired" ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
                                    ⏰ Expired
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                                    ❌ Gagal
                                  </span>
                                )}
                              </TableCell>
                              <TableCell className="text-gray-600 text-sm">
                                {new Date(t.createdAt).toLocaleDateString('id-ID', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric'
                                })}
                              </TableCell>
                              <TableCell>
                                {t.paymentStatus === "pending" ? (
                                  <Button
                                    size="sm"
                                    onClick={() => syncOneMutation.mutate(t.id)}
                                    disabled={syncOneMutation.isPending}
                                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-3 py-1"
                                  >
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    Cek Midtrans
                                  </Button>
                                ) : (
                                  <span className="text-gray-400 text-xs">-</span>
                                )}
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={9} className="text-center py-12">
                              <div className="flex flex-col items-center gap-3">
                                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
                                  <UserX className="w-8 h-8 text-gray-400" />
                                </div>
                                <div>
                                  <p className="text-gray-900 font-semibold">Belum ada guest buyer</p>
                                  <p className="text-sm text-gray-500 mt-1">
                                    Transaksi dari pembeli tanpa login akan muncul di sini
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
