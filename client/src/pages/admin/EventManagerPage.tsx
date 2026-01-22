import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/AdminSidebar";
import { AdminPageHeader } from "@/components/AdminPageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
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
import { Badge } from "@/components/ui/badge";
import {
  ChevronDown,
  ChevronUp,
  Upload,
  Calendar as CalendarIcon,
} from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

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
  bannerHomepage?: string;
  bannerUndian?: string;
}


export default function EventManagerPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [currentEvent, setCurrentEvent] = useState<Event | null>(null);
  
  const [bannerHomepageFile, setBannerHomepageFile] = useState<File | null>(null);
  const [bannerUndianFile, setBannerUndianFile] = useState<File | null>(null);
  const homepageBannerRef = useRef<HTMLInputElement>(null);
  const undianBannerRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    description: "",
    startDate: "",
    endDate: "",
    isActive: true,
    isRefundable: false,
  });

  const { data: events = [] } = useQuery<Event[]>({
    queryKey: ["/api/events"],
  });

  const currentEvents = events.filter(e => e.status === "active");
  const pastEvents = events.filter(e => e.status === "completed");

  const getEventStats = (eventId: string) => {
    return {
      ticketsSold: 0,
      revenue: 0,
      result: 0,
      refundTotal: 0,
    };
  };

  const createEventMutation = useMutation({
    mutationFn: async (data: FormData | Record<string, any>) => {
      const url = editingEventId ? `/api/events/${editingEventId}` : "/api/events";
      const method = editingEventId ? "PUT" : "POST";
      
      const isFormData = data instanceof FormData;
      
      const res = await fetch(url, {
        method,
        body: isFormData ? data : JSON.stringify(data),
        headers: {
          Authorization: `Bearer ${localStorage.getItem("admin_token")}`,
          ...(isFormData ? {} : { "Content-Type": "application/json" }),
        },
      });
      if (!res.ok) throw new Error(editingEventId ? "Failed to update event" : "Failed to create event");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      toast({
        title: "Success",
        description: editingEventId ? "Event berhasil diupdate" : "Event berhasil dibuat",
      });
      resetForm();
    },
    onError: () => {
      toast({
        title: "Error",
        description: editingEventId ? "Gagal mengupdate event" : "Gagal membuat event",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      price: "",
      description: "",
      startDate: "",
      endDate: "",
      isActive: true,
      isRefundable: false,
    });
    setBannerHomepageFile(null);
    setBannerUndianFile(null);
    setCurrentEvent(null);
    setEditingEventId(null);
  };

  const loadEventForEdit = (event: Event) => {
    setFormData({
      name: event.name,
      price: String(event.price),
      description: event.description,
      startDate: new Date(event.startDate).toISOString().slice(0, 16),
      endDate: new Date(event.endDate).toISOString().slice(0, 16),
      isActive: true,
      isRefundable: event.isRefundable || false,
    });
    setCurrentEvent(event);
    setEditingEventId(event.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const formDataToSend = new FormData();
    formDataToSend.append("name", formData.name);
    formDataToSend.append("price", formData.price);
    formDataToSend.append("description", formData.description);
    formDataToSend.append("startDate", formData.startDate);
    formDataToSend.append("endDate", formData.endDate);
    formDataToSend.append("isRefundable", formData.isRefundable.toString());
    
    if (bannerHomepageFile) {
      formDataToSend.append("bannerHomepage", bannerHomepageFile);
    }
    if (bannerUndianFile) {
      formDataToSend.append("bannerUndian", bannerUndianFile);
    }
    
    createEventMutation.mutate(formDataToSend);
  };


  return (
    <SidebarProvider>
      <AdminSidebar />
      <div className="flex flex-col flex-1 min-h-screen admin-light bg-gray-50">
        <AdminPageHeader
          title="Event Manager"
          description="Kelola event, monitor peserta, dan analisis performa event"
          breadcrumbs={[
            { label: "Home", href: "/admin/dashboard" },
            { label: "Event Manager" },
          ]}
        />

        <div className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto space-y-8">
            
            <Card className="border-2 border-green-200 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-green-800">
                    {editingEventId ? "Edit Event" : "Buat Event Baru"}
                  </CardTitle>
                  {editingEventId && (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={resetForm}
                      className="text-gray-600"
                    >
                      Batal Edit
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-medium">Nama Event</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Undian A"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="price" className="text-sm font-medium">Harga Tiket</Label>
                    <Input
                      id="price"
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      placeholder="10.000"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Banner Homepage</Label>
                    <div className="flex items-center gap-3">
                      <input
                        ref={homepageBannerRef}
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) setBannerHomepageFile(file);
                        }}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        onClick={() => homepageBannerRef.current?.click()}
                        className="bg-blue-500 hover:bg-blue-600 text-white"
                      >
                        Pilih File
                      </Button>
                      <span className="text-sm text-gray-500">
                        {bannerHomepageFile ? bannerHomepageFile.name : "Tidak ada file yg di pilih"}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Banner Halaman Undian 1</Label>
                    <div className="flex items-center gap-3">
                      <input
                        ref={undianBannerRef}
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) setBannerUndianFile(file);
                        }}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        onClick={() => undianBannerRef.current?.click()}
                        className="bg-blue-500 hover:bg-blue-600 text-white"
                      >
                        Pilih File
                      </Button>
                      <span className="text-sm text-gray-500">
                        {bannerUndianFile ? bannerUndianFile.name : "Tidak ada file yg di pilih"}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-sm font-medium">
                      Text editor buat isi deskripsi di bawah banner di halaman Undian 1
                    </Label>
                    <Textarea
                      id="description"
                      placeholder="Tulis deskripsi event..."
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={6}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Jadwal Event</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        type="datetime-local"
                        value={formData.startDate}
                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                        required
                      />
                      <Input
                        type="datetime-local"
                        value={formData.endDate}
                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Status Event:</Label>
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={formData.isActive}
                        onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                        className="data-[state=checked]:bg-green-600"
                      />
                      <Label className="text-sm">
                        {formData.isActive ? "Active" : "Inactive"}
                      </Label>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          id="status-refund"
                          name="refundStatus"
                          checked={formData.isRefundable === true}
                          onChange={() => setFormData({ ...formData, isRefundable: true })}
                          className="w-4 h-4 cursor-pointer"
                        />
                        <Label htmlFor="status-refund" className="text-sm cursor-pointer">
                          Refund
                        </Label>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          id="status-non-refund"
                          name="refundStatus"
                          checked={formData.isRefundable === false}
                          onChange={() => setFormData({ ...formData, isRefundable: false })}
                          className="w-4 h-4 cursor-pointer"
                        />
                        <Label htmlFor="status-non-refund" className="text-sm cursor-pointer">
                          Non refund
                        </Label>
                      </div>
                    </div>
                  </div>

                  <Button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white px-8">
                    {editingEventId ? "Update Event" : "Post Event"}
                  </Button>
                </form>
              </CardContent>
            </Card>

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
                          <p className="text-sm text-gray-600">Tiket Terjual</p>
                          <p className="font-medium">{stats.ticketsSold}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Pendapatan</p>
                          <p className="font-medium">Rp {stats.revenue.toLocaleString("id-ID")}</p>
                        </div>
                      </div>
                      {event.description && (
                        <div>
                          <p className="text-sm text-gray-600">Deskripsi</p>
                          <p className="mt-1">{event.description}</p>
                        </div>
                      )}
                      <div className="flex gap-3 pt-4">
                        <Button
                          type="button"
                          onClick={() => loadEventForEdit(event)}
                          className="flex-1 bg-blue-600 hover:bg-blue-700"
                        >
                          Edit Event
                        </Button>
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
                              <p className="font-medium">Rp {stats.revenue.toLocaleString("id-ID")}</p>
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
