import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminSidebar } from "@/components/AdminSidebar";
import { AdminPageHeader } from "@/components/AdminPageHeader";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { Card, CardContent } from "@/components/ui/card";
import { Search, Plus, Edit, Trash2, Eye, TrendingUp, Calendar as CalendarIcon } from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";
import type { Event, Transaction } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function EventsListPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<Event | null>(null);
  const { toast } = useToast();

  const { data: events, isLoading } = useQuery<Event[]>({
    queryKey: ["/api/admin/events"],
  });

  const { data: allTransactions } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
  });

  // Calculate actual paid tickets from transactions (more accurate than ticketsReceived field)
  const getEventTicketsSold = (eventId: string) => {
    if (!allTransactions) return 0;
    return allTransactions
      .filter((t) => t.eventId === eventId && t.paymentStatus === "paid")
      .reduce((sum, t) => sum + (t.ticketCount || 1), 0);
  };

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest(`/api/events/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/events"] });
      toast({
        title: "Event Dihapus",
        description: "Event berhasil dihapus dari sistem",
      });
      setDeleteDialogOpen(false);
      setEventToDelete(null);
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Gagal menghapus event",
        description: error.message,
      });
    },
  });

  const handleDeleteClick = (event: Event) => {
    setEventToDelete(event);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (eventToDelete) {
      deleteMutation.mutate(eventToDelete.id);
    }
  };

  const filteredEvents = events?.filter(event =>
    event.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "aktif":
        return <Badge className="bg-green-500 hover:bg-green-600 text-white border-0" data-testid={`status-aktif`}>Aktif</Badge>;
      case "selesai":
        return <Badge className="bg-gray-500 hover:bg-gray-600 text-white border-0" data-testid={`status-selesai`}>Selesai</Badge>;
      case "nonaktif":
        return <Badge className="bg-red-500 hover:bg-red-600 text-white border-0" data-testid={`status-nonaktif`}>Nonaktif</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <SidebarProvider>
      <AdminSidebar />
      <div className="flex flex-col flex-1 min-h-screen admin-light bg-gray-50">
        <AdminPageHeader 
            title="Daftar Event"
            description="Kelola semua event undian dan pilih pemenang"
            breadcrumbs={[
              { label: "Home", href: "/admin-panel-7x9k/dashboard" },
              { label: "Events", href: "/admin-panel-7x9k/events" },
              { label: "Daftar Event" }
            ]}
            actions={
              <Link href="/admin-panel-7x9k/events/create">
                <Button data-testid="button-create-event" className="bg-[#2e5feb] hover:bg-blue-700 text-white shadow-lg">
                  <Plus className="w-4 h-4 mr-2" />
                  Buat Event Baru
                </Button>
              </Link>
            }
          />

        <div className="flex-1 p-8 overflow-y-auto">
            <div className="max-w-7xl mx-auto space-y-6">
              {/* Search Card */}
              <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-50 to-purple-50">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row items-center gap-4">
                    <div className="relative flex-1 w-full">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input
                        type="text"
                        placeholder="Cari nama event..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        data-testid="input-search"
                        className="pl-12 h-12 border-2 border-purple-200 focus:border-purple-400 focus:ring-purple-400 rounded-xl text-base"
                      />
                    </div>
                    <div className="bg-white px-4 py-2 rounded-xl border-2 border-purple-200 shadow-sm">
                      <span className="text-sm font-semibold text-gray-700">
                        <span className="text-purple-600">{filteredEvents.length}</span> event ditemukan
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Main Table Card */}
              <Card className="border-0 shadow-lg overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <CalendarIcon className="w-6 h-6" />
                    Daftar Event
                  </h2>
                  <p className="text-blue-100 mt-1">Kelola semua event undian dan pilih pemenang</p>
                </div>

                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gradient-to-r from-gray-50 to-purple-50 hover:from-gray-100 hover:to-purple-100">
                        <TableHead className="font-bold text-gray-700">Nama Event</TableHead>
                        <TableHead className="font-bold text-gray-700">Periode</TableHead>
                        <TableHead className="font-bold text-gray-700">Status</TableHead>
                        <TableHead className="font-bold text-gray-700">Harga Tiket</TableHead>
                        <TableHead className="font-bold text-gray-700">Tiket Terjual</TableHead>
                        <TableHead className="font-bold text-gray-700">Hadiah</TableHead>
                        <TableHead className="font-bold text-gray-700 text-right">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoading ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-12">
                            <div className="flex flex-col items-center gap-3">
                              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                              <p className="text-gray-500 font-medium">Memuat data event...</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : filteredEvents.length > 0 ? (
                        filteredEvents.map((event) => (
                          <TableRow key={event.id} data-testid={`row-event-${event.id}`} className="hover:bg-purple-50/50 transition-colors">
                            <TableCell>
                              <Link href={`/admin-panel-7x9k/events/${event.id}/participants`}>
                                <span className="font-semibold text-gray-900 hover:text-purple-600 hover:underline transition-colors cursor-pointer">
                                  {event.name}
                                </span>
                              </Link>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="text-sm font-medium text-gray-700">
                                  {new Date(event.startDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })} - {new Date(event.endDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {Math.ceil((new Date(event.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} hari lagi
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>{getStatusBadge(event.status)}</TableCell>
                            <TableCell>
                              <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-bold whitespace-nowrap">
                                Rp {event.price.toLocaleString('id-ID')}
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-2">
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 max-w-[120px] h-2 bg-gray-200 rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transition-all"
                                      style={{ width: `${Math.min((getEventTicketsSold(event.id) / event.ticketCount) * 100, 100)}%` }}
                                    />
                                  </div>
                                  <span className="text-sm font-bold text-gray-700">{Math.round((getEventTicketsSold(event.id) / event.ticketCount) * 100)}%</span>
                                </div>
                                <span className="text-xs text-gray-600 font-medium">
                                  {getEventTicketsSold(event.id)} / {event.ticketCount} tiket
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="inline-flex items-center gap-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-3 py-1 rounded-full text-sm font-bold shadow-md whitespace-nowrap">
                                Rp {event.hadiah.toLocaleString('id-ID')}
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2 justify-end">
                                <Link href={`/admin-panel-7x9k/events/${event.id}/participants`}>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    data-testid={`button-detail-${event.id}`}
                                    className="border-2 border-blue-300 text-blue-600 hover:bg-blue-50 hover:border-blue-400 font-semibold"
                                  >
                                    <Eye className="w-4 h-4 mr-1" />
                                    Detail
                                  </Button>
                                </Link>
                                <Link href={`/admin-panel-7x9k/events/${event.id}/edit`}>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    data-testid={`button-edit-${event.id}`}
                                    className="border-2 border-yellow-300 text-yellow-600 hover:bg-yellow-50 hover:border-yellow-400 font-semibold"
                                  >
                                    <Edit className="w-4 h-4 mr-1" />
                                    Edit
                                  </Button>
                                </Link>
                                <Button
                                  size="sm"
                                  data-testid={`button-delete-${event.id}`}
                                  onClick={() => handleDeleteClick(event)}
                                  disabled={deleteMutation.isPending}
                                  className="bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 text-white font-semibold shadow-md"
                                >
                                  <Trash2 className="w-4 h-4 mr-1" />
                                  Hapus
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-12">
                            <div className="flex flex-col items-center gap-3">
                              <div className="bg-gray-100 rounded-full p-4">
                                <CalendarIcon className="w-12 h-12 text-gray-400" />
                              </div>
                              <div>
                                <p className="text-gray-900 font-semibold text-lg">
                                  {searchQuery ? "Tidak ada event ditemukan" : "Belum ada event"}
                                </p>
                                <p className="text-sm text-gray-500 mt-1">
                                  {searchQuery ? "Coba kata kunci lain" : "Buat event pertama Anda untuk memulai"}
                                </p>
                              </div>
                              {!searchQuery && (
                                <Link href="/admin-panel-7x9k/events/create">
                                  <Button className="mt-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg">
                                    <Plus className="w-4 h-4 mr-2" />
                                    Buat Event Baru
                                  </Button>
                                </Link>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </Card>
          </div>
        </div>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="border-0 shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold text-gray-900">Hapus Event?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600">
              Apakah Anda yakin ingin menghapus event <span className="font-semibold text-gray-900">"{eventToDelete?.name}"</span>? 
              Tindakan ini tidak dapat dibatalkan dan semua data terkait akan hilang.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete" className="hover:bg-gray-100">Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              data-testid="button-confirm-delete"
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleteMutation.isPending ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Menghapus...</span>
                </div>
              ) : (
                "Hapus Event"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SidebarProvider>
  );
}
