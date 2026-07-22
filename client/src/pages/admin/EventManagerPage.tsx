import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/AdminSidebar";
import { AdminPageHeader } from "@/components/AdminPageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp, Plus, Edit } from "lucide-react";
import { format } from "date-fns";
import { Link } from "wouter";

interface Event {
  id: string;
  name: string;
  imageUrl: string;
  description: string;
  price: number;
  ticketCount: number;
  ticketsReceived: number;
  prize: string;
  hadiah: number;
  startDate: string;
  endDate: string;
  announcementDate: string;
  status: string;
  category: string | null;
  cardTemplate: string | null;
  createdAt: string;
  isRefundable?: boolean;
  hasMultipleUndian?: boolean;
  undianALabel?: string;
  undianBLabel?: string;
  allowCustomAmount?: boolean;
  scheduleType?: string;
}


export default function EventManagerPage() {
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);

  // Use admin endpoint to see ALL events (not just aktif)
  const { data: events = [] } = useQuery<Event[]>({
    queryKey: ["/api/admin/events"],
  });

  const currentEvents = events.filter(e => e.status === "aktif" || e.status === "nonaktif");
  const pastEvents = events.filter(e => e.status === "selesai");

  const getEventStats = (_eventId: string) => {
    return {
      ticketsSold: 0,
      revenue: 0,
      result: 0,
      refundTotal: 0,
    };
  };

  return (
    <SidebarProvider>
      <AdminSidebar />
      <div className="flex flex-col flex-1 min-h-screen admin-light bg-gray-50">
        <AdminPageHeader
          title="Event Manager"
          description="Kelola event, monitor peserta, dan analisis performa event"
          breadcrumbs={[
            { label: "Home", href: "/admin-panel-7x9k/dashboard" },
            { label: "Event Manager" },
          ]}
          actions={
            <Link href="/admin-panel-7x9k/events/create">
              <Button className="bg-green-600 hover:bg-green-700 text-white shadow-lg">
                <Plus className="w-4 h-4 mr-2" />
                Buat Event Baru
              </Button>
            </Link>
          }
        />

        <div className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto space-y-8">

            {currentEvents.length === 0 && (
              <Card className="border-2 border-dashed border-gray-300">
                <CardContent className="p-12 text-center">
                  <p className="text-gray-500 mb-4">Belum ada event aktif.</p>
                  <Link href="/admin-panel-7x9k/events/create">
                    <Button className="bg-green-600 hover:bg-green-700 text-white">
                      <Plus className="w-4 h-4 mr-2" />
                      Buat Event Baru
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}

            {currentEvents.map((event) => {
              const stats = getEventStats(event.id);
              const isExpanded = expandedEventId === event.id;

              return (
                <Card key={event.id} className="border-2 border-blue-200 shadow-lg">
                  <CardHeader
                    className="bg-gradient-to-r from-blue-50 to-cyan-50 cursor-pointer"
                    onClick={() => setExpandedEventId(isExpanded ? null : event.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-blue-800">{event.name}</CardTitle>
                        <p className="text-sm text-gray-600 mt-1">
                          Status: {event.status} | Kategori: {event.category || "other"}
                          {event.hasMultipleUndian && (
                            <span className="ml-2 text-purple-600 font-medium">
                              · Dual Undian ({event.undianALabel || "A"} & {event.undianBLabel || "B"})
                            </span>
                          )}
                          {event.scheduleType && event.scheduleType !== "none" && (
                            <span className="ml-2 text-blue-600 font-medium">
                              · Berulang ({event.scheduleType})
                            </span>
                          )}
                        </p>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="w-6 h-6 text-blue-600" />
                      ) : (
                        <ChevronDown className="w-6 h-6 text-blue-600" />
                      )}
                    </div>
                  </CardHeader>

                  {isExpanded && (
                    <CardContent className="p-6 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Jadwal Event</p>
                          <p className="font-medium">
                            {format(new Date(event.startDate), "dd/MM/yyyy HH:mm")} -{" "}
                            {format(new Date(event.endDate), "dd/MM/yyyy HH:mm")}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Harga Tiket</p>
                          <p className="font-medium">Rp {event.price.toLocaleString("id-ID")}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Jumlah Tiket</p>
                          <p className="font-medium">{event.ticketCount.toLocaleString("id-ID")}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Hadiah</p>
                          <p className="font-medium">Rp {event.hadiah.toLocaleString("id-ID")}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Tiket Terjual</p>
                          <p className="font-medium">{stats.ticketsSold}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Refundable</p>
                          <p className="font-medium">{event.isRefundable ? "Ya" : "Tidak"}</p>
                        </div>
                      </div>
                      {event.description && (
                        <div>
                          <p className="text-sm text-gray-600">Deskripsi</p>
                          <p className="mt-1">{event.description}</p>
                        </div>
                      )}
                      <div className="flex gap-3 pt-4">
                        <Link href={`/admin-panel-7x9k/events/${event.id}/edit`} className="flex-1">
                          <Button className="w-full bg-blue-600 hover:bg-blue-700">
                            <Edit className="w-4 h-4 mr-2" />
                            Edit Event
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  )}
                </Card>
              );
            })}

            {pastEvents.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-gray-800">Past Event</h2>
                {pastEvents.map((event) => {
                  const stats = getEventStats(event.id);
                  return (
                    <Card key={event.id} className="border-2 border-gray-200 shadow-md">
                      <CardContent className="p-6">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h3 className="text-lg font-bold text-gray-800">{event.name}</h3>
                            <Badge variant={stats.result >= 0 ? "default" : "destructive"}>
                              {stats.result >= 0 ? "Profit" : "Loss"}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <p className="text-gray-600">Tanggal Selesai</p>
                              <p className="font-medium">
                                {format(new Date(event.endDate), "dd MMMM yyyy")}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-600">Harga Tiket</p>
                              <p className="font-medium">Rp {event.price.toLocaleString("id-ID")}</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Tiket Terjual</p>
                              <p className="font-medium">{stats.ticketsSold}</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Hadiah</p>
                              <p className="font-medium">Rp {event.hadiah.toLocaleString("id-ID")}</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Refund Total</p>
                              <p className="font-medium text-red-600">
                                {stats.refundTotal > 0 ? `Rp ${stats.refundTotal.toLocaleString("id-ID")}` : "-"}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-600">Hasil</p>
                              <p className={`font-medium ${stats.result >= 0 ? "text-green-600" : "text-red-600"}`}>
                                {stats.result >= 0 ? "+" : ""}Rp {stats.result.toLocaleString("id-ID")}
                              </p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
}
