import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminSidebar } from "@/components/AdminSidebar";
import { AdminPageHeader } from "@/components/AdminPageHeader";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, CreditCard, Trophy, TrendingUp, ArrowUpRight, Users, DollarSign, Activity, Database } from "lucide-react";
import type { Event, Transaction, Winner } from "@shared/schema";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function DashboardPage() {
  const { toast } = useToast();

  const migrationMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("/api/admin/run-migration", {
        method: "POST",
      });
    },
    onSuccess: (data: any) => {
      toast({
        title: "✅ Migrasi Berhasil",
        description: `${data.results?.length || 0} perintah dijalankan`,
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Gagal Migrasi",
        description: error.message,
      });
    },
  });

  const { data: events } = useQuery<Event[]>({
    queryKey: ["/api/admin/events"],
  });

  const { data: transactions } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
  });

  const { data: winners } = useQuery<Winner[]>({
    queryKey: ["/api/winners"],
  });

  const activeEvents = events?.filter(e => e.status === "aktif").length || 0;
  const totalRevenue = transactions?.reduce((sum, t) => sum + t.amount, 0) || 0;
  const totalWinners = winners?.length || 0;
  const totalTransactions = transactions?.length || 0;
  const totalEvents = events?.length || 0;

  const stats = [
    {
      title: "Total Events",
      value: totalEvents,
      change: `${activeEvents} aktif`,
      icon: Calendar,
      gradient: "from-blue-500 to-cyan-500",
      bg: "bg-blue-50",
      iconBg: "bg-gradient-to-br from-blue-500 to-cyan-500",
      textColor: "text-blue-600",
    },
    {
      title: "Total Transaksi",
      value: totalTransactions,
      change: "Live data",
      icon: CreditCard,
      gradient: "from-green-500 to-emerald-500",
      bg: "bg-green-50",
      iconBg: "bg-gradient-to-br from-green-500 to-emerald-500",
      textColor: "text-green-600",
    },
    {
      title: "Total Pendapatan",
      value: `Rp ${totalRevenue.toLocaleString('id-ID')}`,
      change: "All time",
      icon: DollarSign,
      gradient: "from-purple-500 to-pink-500",
      bg: "bg-purple-50",
      iconBg: "bg-gradient-to-br from-purple-500 to-pink-500",
      textColor: "text-purple-600",
    },
    {
      title: "Pemenang Diumumkan",
      value: totalWinners,
      change: "Total winners",
      icon: Trophy,
      gradient: "from-amber-500 to-orange-500",
      bg: "bg-amber-50",
      iconBg: "bg-gradient-to-br from-amber-500 to-orange-500",
      textColor: "text-amber-600",
    },
  ];

  return (
    <SidebarProvider>
      <AdminSidebar />
      <div className="flex flex-col flex-1 min-h-screen admin-light bg-gray-50">
        <AdminPageHeader 
          title="Dashboard"
          description="Selamat datang di Admin Panel Undifest"
          breadcrumbs={[
            { label: "Home", href: "/admin-panel-7x9k/dashboard" },
            { label: "Dashboard" }
          ]}
        />

        <div className="flex-1 p-8 overflow-y-auto">
            <div className="max-w-7xl mx-auto space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat) => (
                  <Card key={stat.title} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
                    <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-5 transition-opacity`}></div>
                    <CardContent className="p-6 relative">
                      <div className="flex items-start justify-between mb-4">
                        <div className={`${stat.iconBg} p-3 rounded-xl shadow-lg`}>
                          <stat.icon className="h-6 w-6 text-white" />
                        </div>
                        <div className={`flex items-center gap-1 text-xs ${stat.textColor} font-semibold`}>
                          <Activity className="w-3 h-3" />
                          <span>{stat.change}</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
                        <h3 className="text-3xl font-bold text-gray-900">{stat.value}</h3>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="border-0 shadow-lg">
                  <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 border-b pb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg font-bold text-gray-900">Event Terbaru</CardTitle>
                        <p className="text-sm text-gray-600 mt-1">Daftar event yang baru dibuat</p>
                      </div>
                      <Calendar className="w-6 h-6 text-blue-600" />
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      {events && events.length > 0 ? (
                        events.slice(0, 5).map((event) => (
                          <div key={event.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all group">
                            <div className="flex-1">
                              <p className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">{event.name}</p>
                              <div className="flex items-center gap-4 mt-2">
                                <p className="text-sm text-gray-500">Rp {event.price.toLocaleString('id-ID')}</p>
                                <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                                  event.status === "aktif" 
                                    ? "bg-green-100 text-green-700 border border-green-200" 
                                    : "bg-gray-100 text-gray-600 border border-gray-200"
                                }`}>
                                  {event.status}
                                </span>
                              </div>
                            </div>
                            <ArrowUpRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-12">
                          <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                          <p className="text-gray-500 font-medium">Belum ada event</p>
                          <p className="text-sm text-gray-400 mt-1">Buat event pertama Anda</p>
                          <Link href="/admin-panel-7x9k/events/create">
                            <Button className="mt-4 bg-blue-600 hover:bg-blue-700">
                              Buat Event
                            </Button>
                          </Link>
                        </div>
                      )}
                    </div>
                    {events && events.length > 5 && (
                      <Link href="/admin-panel-7x9k/events">
                        <Button variant="outline" className="w-full mt-4 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200">
                          Lihat Semua Event
                        </Button>
                      </Link>
                    )}
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg">
                  <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b pb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg font-bold text-gray-900">Transaksi Terbaru</CardTitle>
                        <p className="text-sm text-gray-600 mt-1">Pembelian tiket terbaru</p>
                      </div>
                      <CreditCard className="w-6 h-6 text-green-600" />
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      {transactions && transactions.length > 0 ? (
                        transactions.slice(0, 5).map((transaction) => (
                          <div key={transaction.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-100 hover:border-green-200 hover:shadow-md transition-all group">
                            <div className="flex-1">
                              <p className="font-semibold text-gray-900 group-hover:text-green-600 transition-colors">{transaction.eventName}</p>
                              <p className="text-sm text-gray-500 mt-1">{transaction.phoneNumber}</p>
                            </div>
                            <span className="font-bold text-green-600 text-lg">Rp {transaction.amount.toLocaleString('id-ID')}</span>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-12">
                          <CreditCard className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                          <p className="text-gray-500 font-medium">Belum ada transaksi</p>
                          <p className="text-sm text-gray-400 mt-1">Transaksi akan muncul di sini</p>
                        </div>
                      )}
                    </div>
                    {transactions && transactions.length > 5 && (
                      <Link href="/admin-panel-7x9k/transactions">
                        <Button variant="outline" className="w-full mt-4 hover:bg-green-50 hover:text-green-600 hover:border-green-200">
                          Lihat Semua Transaksi
                        </Button>
                      </Link>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-600 to-purple-600 text-white">
                  <CardContent className="p-6">
                    <Users className="w-12 h-12 mb-4 opacity-80" />
                    <h3 className="text-2xl font-bold mb-2">Member Management</h3>
                    <p className="text-white/80 text-sm mb-4">Kelola data member platform</p>
                    <Link href="/admin-panel-7x9k/members">
                      <Button variant="secondary" className="w-full">
                        Lihat Member
                      </Button>
                    </Link>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-500 to-orange-600 text-white">
                  <CardContent className="p-6">
                    <Trophy className="w-12 h-12 mb-4 opacity-80" />
                    <h3 className="text-2xl font-bold mb-2">Winners</h3>
                    <p className="text-white/80 text-sm mb-4">Nominasikan dan umumkan pemenang</p>
                    <Link href="/admin-panel-7x9k/winners">
                      <Button variant="secondary" className="w-full">
                        Kelola Pemenang
                      </Button>
                    </Link>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg bg-gradient-to-br from-green-600 to-emerald-600 text-white">
                  <CardContent className="p-6">
                    <Activity className="w-12 h-12 mb-4 opacity-80" />
                    <h3 className="text-2xl font-bold mb-2">Reports</h3>
                    <p className="text-white/80 text-sm mb-4">Lihat laporan dan statistik</p>
                    <Link href="/admin-panel-7x9k/reports">
                      <Button variant="secondary" className="w-full">
                        Lihat Laporan
                      </Button>
                    </Link>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg bg-gradient-to-br from-slate-600 to-gray-700 text-white">
                  <CardContent className="p-6">
                    <Database className="w-12 h-12 mb-4 opacity-80" />
                    <h3 className="text-2xl font-bold mb-2">Migrasi DB</h3>
                    <p className="text-white/80 text-sm mb-4">Tambah kolom baru ke database (jalankan 1x setelah update)</p>
                    <Button
                      variant="secondary"
                      className="w-full"
                      onClick={() => migrationMutation.mutate()}
                      disabled={migrationMutation.isPending}
                    >
                      {migrationMutation.isPending ? "Menjalankan..." : "Jalankan Migrasi"}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
    </SidebarProvider>
  );
}
