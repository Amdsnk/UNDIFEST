import { useQuery } from "@tanstack/react-query";
import { AdminSidebar } from "@/components/AdminSidebar";
import { AdminPageHeader } from "@/components/AdminPageHeader";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { DollarSign, Trophy, Users } from "lucide-react";
import { useState } from "react";
import type { Event, Transaction, Winner, User } from "@shared/schema";

export default function DaftarTransferPage() {
  const [selectedEventId, setSelectedEventId] = useState<string>("__all__");

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

  // Filter refundable events (status = selesai)
  const refundableEvents = events?.filter(e => e.status === "selesai") || [];

  // Filter transactions based on selected event
  const filteredTransactions = selectedEventId !== "__all__"
    ? transactions?.filter(t => t.eventId === selectedEventId) || []
    : transactions?.filter(t => {
        const event = events?.find(e => e.id === t.eventId);
        return event?.status === "selesai";
      }) || [];

  // Get winners for filtered transactions
  const winnerUserIds = new Set(
    winners
      ?.filter(w => selectedEventId === "__all__" || w.eventId === selectedEventId)
      .map(w => w.userId) || []
  );

  // Separate winners and non-winners
  const winnerTransactions = filteredTransactions.filter(t => winnerUserIds.has(t.userId));
  const nonWinnerTransactions = filteredTransactions.filter(t => !winnerUserIds.has(t.userId));

  const getUserInfo = (userId: string) => {
    return users?.find(u => u.id === userId);
  };

  const getEventInfo = (eventId: string) => {
    return events?.find(e => e.id === eventId);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const totalRefund = nonWinnerTransactions.reduce((sum, t) => sum + t.amount, 0);
  const totalWinnerAmount = winnerTransactions.reduce((sum, t) => sum + t.amount, 0);

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full admin-light">
        <AdminSidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <AdminPageHeader
            title="Daftar Transfer"
            description="Daftar transaksi yang perlu di-refund dan pemenang"
            icon={DollarSign}
          />

          <main className="flex-1 overflow-auto p-6 bg-gray-50">
            <div className="max-w-7xl mx-auto space-y-6">
              {/* Filter */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <label className="text-sm font-medium">Filter Event:</label>
                    <Select value={selectedEventId} onValueChange={setSelectedEventId}>
                      <SelectTrigger className="w-64">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__all__">Semua Event Selesai</SelectItem>
                        {refundableEvents.map((event) => (
                          <SelectItem key={event.id} value={event.id}>
                            {event.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm opacity-90">Total Refund</p>
                        <p className="text-2xl font-bold mt-1">{formatCurrency(totalRefund)}</p>
                      </div>
                      <DollarSign className="w-10 h-10 opacity-50" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm opacity-90">Total Pemenang</p>
                        <p className="text-2xl font-bold mt-1">{winnerTransactions.length}</p>
                      </div>
                      <Trophy className="w-10 h-10 opacity-50" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm opacity-90">Perlu Refund</p>
                        <p className="text-2xl font-bold mt-1">{nonWinnerTransactions.length}</p>
                      </div>
                      <Users className="w-10 h-10 opacity-50" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Winners Table */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-yellow-500" />
                    Pemenang ({winnerTransactions.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>No</TableHead>
                        <TableHead>Event</TableHead>
                        <TableHead>Nama</TableHead>
                        <TableHead>No. Telepon</TableHead>
                        <TableHead>Kota</TableHead>
                        <TableHead>Tiket</TableHead>
                        <TableHead className="text-right">Total Bayar</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {winnerTransactions.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                            Belum ada pemenang
                          </TableCell>
                        </TableRow>
                      ) : (
                        winnerTransactions.map((transaction, index) => {
                          const user = getUserInfo(transaction.userId);
                          const event = getEventInfo(transaction.eventId);
                          return (
                            <TableRow key={transaction.id} className="bg-yellow-50">
                              <TableCell>{index + 1}</TableCell>
                              <TableCell className="font-medium">{event?.name || "-"}</TableCell>
                              <TableCell>{user?.name || "-"}</TableCell>
                              <TableCell>{user?.phoneNumber || "-"}</TableCell>
                              <TableCell>{user?.city || "-"}</TableCell>
                              <TableCell>{transaction.ticketCount}x</TableCell>
                              <TableCell className="text-right font-semibold text-green-600">
                                {formatCurrency(transaction.amount)}
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Non-Winners Table (Refund List) */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-red-500" />
                    Perlu Refund ({nonWinnerTransactions.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>No</TableHead>
                        <TableHead>Event</TableHead>
                        <TableHead>Nama</TableHead>
                        <TableHead>No. Telepon</TableHead>
                        <TableHead>Kota</TableHead>
                        <TableHead>Tiket</TableHead>
                        <TableHead className="text-right">Jumlah Refund</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {nonWinnerTransactions.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                            Tidak ada transaksi yang perlu di-refund
                          </TableCell>
                        </TableRow>
                      ) : (
                        nonWinnerTransactions.map((transaction, index) => {
                          const user = getUserInfo(transaction.userId);
                          const event = getEventInfo(transaction.eventId);
                          return (
                            <TableRow key={transaction.id}>
                              <TableCell>{index + 1}</TableCell>
                              <TableCell className="font-medium">{event?.name || "-"}</TableCell>
                              <TableCell>{user?.name || "-"}</TableCell>
                              <TableCell>{user?.phoneNumber || "-"}</TableCell>
                              <TableCell>{user?.city || "-"}</TableCell>
                              <TableCell>{transaction.ticketCount}x</TableCell>
                              <TableCell className="text-right font-semibold text-red-600">
                                {formatCurrency(transaction.amount)}
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}


