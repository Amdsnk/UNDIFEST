import { AdminSidebar } from "@/components/AdminSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AdminPageHeader } from "@/components/AdminPageHeader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState, useRef, useCallback } from "react";
import { Upload } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

const formSchema = z.object({
  name: z.string().min(1, "Nama event wajib diisi"),
  price: z.number().int().positive("Harga tiket harus lebih dari 0"),
  ticketCount: z.number().int().positive("Jumlah tiket harus lebih dari 0"),
  hadiah: z.number().int().positive("Hadiah harus lebih dari 0"),
  category: z.string().min(1, "Kategori wajib dipilih"),
  bannerHomepage: z.string().optional(),
  bannerUndian: z.string().optional(),
  ebookTitle: z.string().optional(),
  description: z.string().min(1, "Deskripsi wajib diisi"),
  startDate: z.string().min(1, "Jadwal mulai wajib diisi"),
  endDate: z.string().min(1, "Jadwal selesai wajib diisi"),
  isRefundable: z.boolean().default(false),
});

type FormData = z.infer<typeof formSchema>;

export default function CreateEventPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [bannerHomepageFile, setBannerHomepageFile] = useState<File | null>(null);
  const [bannerUndianFile, setBannerUndianFile] = useState<File | null>(null);
  const [ebookFile, setEbookFile] = useState<File | null>(null);
  const [scheduleType, setScheduleType] = useState<string>("none");
  const [scheduleTime, setScheduleTime] = useState<string>("19:00");
  const [scheduleDay, setScheduleDay] = useState<string>("1");
  const homepageBannerRef = useRef<HTMLInputElement>(null);
  const undianBannerRef = useRef<HTMLInputElement>(null);
  const ebookFileRef = useRef<HTMLInputElement>(null);

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 50000,
      ticketCount: 1000,
      hadiah: 1000000,
      category: "other",
      startDate: "",
      endDate: "",
      isRefundable: false,
    },
  });

  const isRefundable = watch("isRefundable");

  const handleHomepageBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBannerHomepageFile(file);
    }
  };

  const handleUndianBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBannerUndianFile(file);
    }
  };

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const formData = new FormData();
      formData.append("name", data.name);
      formData.append("price", data.price.toString());
      formData.append("ticketCount", data.ticketCount.toString());
      formData.append("hadiah", data.hadiah.toString());
      formData.append("category", data.category);
      formData.append("description", data.description);
      formData.append("startDate", data.startDate);
      formData.append("endDate", data.endDate);
      formData.append("isRefundable", data.isRefundable.toString());
      formData.append("scheduleType", scheduleType);
      if (scheduleType !== "none") {
        formData.append("scheduleTime", scheduleTime);
        if (scheduleType === "weekly" || scheduleType === "monthly") {
          formData.append("scheduleDay", scheduleDay);
        }
      }

      // Handle banner files (stored as base64 in database)
      if (bannerHomepageFile) {
        formData.append("bannerHomepage", bannerHomepageFile);
      }
      if (bannerUndianFile) {
        formData.append("bannerUndian", bannerUndianFile);
      }

      // Handle E-book file
      if (ebookFile) {
        formData.append("ebookFile", ebookFile);
      }
      if (data.ebookTitle) {
        formData.append("ebookTitle", data.ebookTitle);
      }

      const response = await fetch("/api/events", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("admin_token")}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Gagal membuat event");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/events"] });
      toast({
        title: "Event Berhasil Dibuat",
        description: "Event baru telah ditambahkan ke sistem",
      });
      
      // Reset form
      setBannerHomepageFile(null);
      setBannerUndianFile(null);
      setEbookFile(null);
      
      // Ask if user wants to create another event
      const createAnother = window.confirm("Event berhasil dibuat! Apakah Anda ingin membuat event lagi?");
      if (createAnother) {
        window.location.reload();
      } else {
        setLocation("/admin-panel-7x9k/events");
      }
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Gagal membuat event",
        description: error.message,
      });
    },
  });

  const onSubmit = (data: FormData) => {
    createMutation.mutate(data);
  };

  return (
    <SidebarProvider>
      <AdminSidebar />
      <div className="flex flex-col flex-1 min-h-screen admin-light bg-gray-50">
        <AdminPageHeader
          title="Event Manager"
          description="Buat event baru untuk undian"
          breadcrumbs={[
            { label: "Home", href: "/admin-panel-7x9k/dashboard" },
            { label: "Events", href: "/admin-panel-7x9k/events" },
            { label: "Buat Event Baru" },
          ]}
        />

        <div className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-4xl mx-auto">
            <Card className="border-0 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
                <CardTitle className="text-blue-900">Form Event Baru</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  <div>
                    <Label htmlFor="name" className="text-sm font-medium">
                      Nama Event
                    </Label>
                    <Input
                      id="name"
                      {...register("name")}
                      placeholder="Undian A"
                      className="mt-1"
                    />
                    {errors.name && (
                      <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="price" className="text-sm font-medium">
                        Harga Tiket
                      </Label>
                      <Input
                        id="price"
                        type="number"
                        {...register("price", { valueAsNumber: true })}
                        placeholder="50.000"
                        className="mt-1"
                      />
                      {errors.price && (
                        <p className="text-red-500 text-sm mt-1">{errors.price.message}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="ticketCount" className="text-sm font-medium">
                        Jumlah Tiket
                      </Label>
                      <Input
                        id="ticketCount"
                        type="number"
                        {...register("ticketCount", { valueAsNumber: true })}
                        placeholder="1000"
                        className="mt-1"
                      />
                      {errors.ticketCount && (
                        <p className="text-red-500 text-sm mt-1">{errors.ticketCount.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="hadiah" className="text-sm font-medium">
                        Hadiah (Rp)
                      </Label>
                      <Input
                        id="hadiah"
                        type="number"
                        {...register("hadiah", { valueAsNumber: true })}
                        placeholder="1.000.000"
                        className="mt-1"
                      />
                      {errors.hadiah && (
                        <p className="text-red-500 text-sm mt-1">{errors.hadiah.message}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="category" className="text-sm font-medium">
                        Kategori
                      </Label>
                      <select
                        id="category"
                        {...register("category")}
                        className="mt-1 w-full h-10 px-3 rounded-md border border-input bg-background"
                      >
                        <option value="other">Lainnya</option>
                        <option value="food">Makanan & Minuman</option>
                        <option value="vehicle">Kendaraan</option>
                        <option value="electronics">Elektronik</option>
                        <option value="fashion">Fashion</option>
                      </select>
                      {errors.category && (
                        <p className="text-red-500 text-sm mt-1">{errors.category.message}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Banner Homepage</Label>
                    <p className="text-xs text-green-600 mb-2">✅ Gambar akan disimpan permanen di database</p>
                    <div className="flex items-center gap-3">
                      <input ref={homepageBannerRef} type="file" accept="image/*" onChange={handleHomepageBannerChange} className="hidden" />
                      <Button type="button" onClick={() => homepageBannerRef.current?.click()} className="bg-blue-500 hover:bg-blue-600 text-white">
                        Pilih File
                      </Button>
                      <span className="text-sm text-gray-500">{bannerHomepageFile ? bannerHomepageFile.name : "Tidak ada file"}</span>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Banner Halaman Undian 1</Label>
                    <p className="text-xs text-green-600 mb-2">✅ Gambar akan disimpan permanen di database</p>
                    <div className="flex items-center gap-3">
                      <input ref={undianBannerRef} type="file" accept="image/*" onChange={handleUndianBannerChange} className="hidden" />
                      <Button type="button" onClick={() => undianBannerRef.current?.click()} className="bg-blue-500 hover:bg-blue-600 text-white">
                        Pilih File
                      </Button>
                      <span className="text-sm text-gray-500">{bannerUndianFile ? bannerUndianFile.name : "Tidak ada file"}</span>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="description" className="text-sm font-medium">
                      Text editor buat isi deskripsi di bawah banner di halaman Undian 1
                    </Label>
                    <Textarea
                      id="description"
                      {...register("description")}
                      placeholder="Tulis deskripsi event..."
                      rows={6}
                      className="mt-1"
                    />
                    {errors.description && (
                      <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>
                    )}
                  </div>

                  <div>
                    <Label className="text-sm font-medium mb-2 block">Jadwal Event</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Input
                          type="datetime-local"
                          {...register("startDate")}
                          className="w-full"
                        />
                        {errors.startDate && (
                          <p className="text-red-500 text-sm mt-1">{errors.startDate.message}</p>
                        )}
                      </div>
                      <div>
                        <Input
                          type="datetime-local"
                          {...register("endDate")}
                          className="w-full"
                        />
                        {errors.endDate && (
                          <p className="text-red-500 text-sm mt-1">{errors.endDate.message}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Recurring Schedule */}
                  <div className="border rounded-lg p-4 bg-blue-50">
                    <Label className="text-sm font-semibold mb-3 block text-blue-900">🔁 Pengulangan Otomatis (Opsional)</Label>
                    <p className="text-xs text-blue-700 mb-3">Jika diaktifkan, event baru akan otomatis dibuat ulang setelah event selesai.</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <Label className="text-xs mb-1 block">Tipe Pengulangan</Label>
                        <Select value={scheduleType} onValueChange={setScheduleType}>
                          <SelectTrigger><SelectValue placeholder="Pilih tipe" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Tidak berulang</SelectItem>
                            <SelectItem value="daily">Harian</SelectItem>
                            <SelectItem value="weekly">Mingguan</SelectItem>
                            <SelectItem value="monthly">Bulanan</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {scheduleType !== "none" && (
                        <div>
                          <Label className="text-xs mb-1 block">Jam Mulai</Label>
                          <Input type="time" value={scheduleTime} onChange={e => setScheduleTime(e.target.value)} className="w-full" />
                        </div>
                      )}
                      {scheduleType === "weekly" && (
                        <div>
                          <Label className="text-xs mb-1 block">Hari</Label>
                          <Select value={scheduleDay} onValueChange={setScheduleDay}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="0">Minggu</SelectItem>
                              <SelectItem value="1">Senin</SelectItem>
                              <SelectItem value="2">Selasa</SelectItem>
                              <SelectItem value="3">Rabu</SelectItem>
                              <SelectItem value="4">Kamis</SelectItem>
                              <SelectItem value="5">Jumat</SelectItem>
                              <SelectItem value="6">Sabtu</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                      {scheduleType === "monthly" && (
                        <div>
                          <Label className="text-xs mb-1 block">Tanggal (1–28)</Label>
                          <Input type="number" min={1} max={28} value={scheduleDay} onChange={e => setScheduleDay(e.target.value)} className="w-full" />
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium mb-3 block">Status Event</Label>
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-3">
                        <Switch
                          checked={isRefundable}
                          onCheckedChange={(checked) => setValue("isRefundable", checked)}
                          className="data-[state=checked]:bg-green-500"
                        />
                        <Label className="text-sm cursor-pointer">
                          {isRefundable ? "Refund" : "Non refund"}
                        </Label>
                      </div>
                    </div>
                  </div>

                  {/* E-book Upload Section */}
                  <div className="border-t pt-6">
                    <Label className="text-sm font-medium mb-3 block">📚 E-book (Opsional)</Label>
                    <p className="text-sm text-gray-500 mb-4">
                      Upload file E-book (PDF) yang akan diberikan kepada pembeli setelah pembayaran berhasil.
                    </p>

                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="ebookTitle" className="text-sm font-medium">
                          Judul E-book
                        </Label>
                        <Input
                          id="ebookTitle"
                          {...register("ebookTitle")}
                          placeholder="Contoh: Panduan Lengkap Undifest"
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label className="text-sm font-medium mb-2 block">
                          File E-book (PDF)
                        </Label>
                        <input
                          type="file"
                          ref={ebookFileRef}
                          accept=".pdf"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              if (file.size > 10 * 1024 * 1024) {
                                toast({
                                  variant: "destructive",
                                  title: "File terlalu besar",
                                  description: "Ukuran file maksimal 10MB",
                                });
                                e.target.value = "";
                                return;
                              }
                              setEbookFile(file);
                              toast({
                                title: "File dipilih",
                                description: file.name,
                              });
                            }
                          }}
                          className="hidden"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => ebookFileRef.current?.click()}
                          className="w-full"
                        >
                          {ebookFile ? `📄 ${ebookFile.name}` : "Pilih File PDF"}
                        </Button>
                        {ebookFile && (
                          <p className="text-sm text-green-600 mt-2">
                            ✓ File siap diupload: {ebookFile.name} ({(ebookFile.size / 1024 / 1024).toFixed(2)} MB)
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button
                      type="submit"
                      className="bg-green-600 hover:bg-green-700 text-white px-8"
                      disabled={createMutation.isPending}
                    >
                      {createMutation.isPending ? "Menyimpan..." : "Post Event"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setLocation("/admin-panel-7x9k/events")}
                    >
                      Batal
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
}
