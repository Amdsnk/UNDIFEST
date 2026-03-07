import { AdminSidebar } from "@/components/AdminSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AdminPageHeader } from "@/components/AdminPageHeader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation, useRoute } from "wouter";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import type { Event } from "@shared/schema";

const formSchema = z.object({
  name: z.string().min(1, "Nama event wajib diisi"),
  price: z.number().int().positive("Harga tiket harus lebih dari 0"),
  ticketCount: z.number().int().positive("Jumlah tiket harus lebih dari 0"),
  hadiah: z.number().int().positive("Hadiah harus lebih dari 0"),
  category: z.string().min(1, "Kategori wajib dipilih"),
  description: z.string().min(1, "Deskripsi wajib diisi"),
  startDate: z.string().min(1, "Jadwal mulai wajib diisi"),
  endDate: z.string().min(1, "Jadwal selesai wajib diisi"),
  isRefundable: z.boolean().default(false),
  status: z.string().min(1, "Status wajib dipilih"),
  ebookTitle: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

export default function EditEventPage() {
  const [, params] = useRoute("/admin/events/:id/edit");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [bannerHomepageFile, setBannerHomepageFile] = useState<File | null>(null);
  const [bannerUndianFile, setBannerUndianFile] = useState<File | null>(null);
  const [ebookFile, setEbookFile] = useState<File | null>(null);
  const homepageBannerRef = useRef<HTMLInputElement>(null);
  const undianBannerRef = useRef<HTMLInputElement>(null);
  const ebookFileRef = useRef<HTMLInputElement>(null);

  const { data: event, isLoading } = useQuery<Event>({
    queryKey: [`/api/events/${params?.id}`],
    enabled: !!params?.id,
  });

  const { register, handleSubmit, formState: { errors }, setValue, watch, reset } = useForm<FormData>({
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
      status: "aktif",
    },
  });

  useEffect(() => {
    if (event) {
      reset({
        name: event.name,
        description: event.description,
        price: event.price,
        ticketCount: event.ticketCount,
        hadiah: event.hadiah,
        category: event.category || "other",
        startDate: new Date(event.startDate).toISOString().slice(0, 16),
        endDate: new Date(event.endDate).toISOString().slice(0, 16),
        isRefundable: event.isRefundable || false,
        status: event.status,
        ebookTitle: event.ebookTitle || "",
      });
    }
  }, [event, reset]);

  const isRefundable = watch("isRefundable");
  const status = watch("status");

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

  const updateMutation = useMutation({
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
      formData.append("status", data.status);
      
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

      const response = await fetch(`/api/events/${params?.id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("admin_token")}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Gagal mengupdate event");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/events"] });
      queryClient.invalidateQueries({ queryKey: [`/api/events/${params?.id}`] });
      toast({
        title: "Event Berhasil Diupdate",
        description: "Perubahan event telah disimpan",
      });
      setLocation("/admin/events");
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Gagal mengupdate event",
        description: error.message,
      });
    },
  });

  const onSubmit = (data: FormData) => {
    updateMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <SidebarProvider>
        <AdminSidebar />
        <div className="flex flex-col flex-1 min-h-screen admin-light bg-gray-50">
          <AdminPageHeader
            title="Edit Event"
            description="Loading..."
            breadcrumbs={[
              { label: "Home", href: "/admin/dashboard" },
              { label: "Events", href: "/admin/events" },
              { label: "Edit Event" },
            ]}
          />
          <div className="flex-1 p-8 flex items-center justify-center">
            <div className="text-gray-500">Loading event data...</div>
          </div>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <AdminSidebar />
      <div className="flex flex-col flex-1 min-h-screen admin-light bg-gray-50">
        <AdminPageHeader
          title="Edit Event"
          description="Edit event yang sudah ada"
          breadcrumbs={[
            { label: "Home", href: "/admin/dashboard" },
            { label: "Events", href: "/admin/events" },
            { label: "Edit Event" },
          ]}
        />

        <div className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-4xl mx-auto">
            <Card className="border-0 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
                <CardTitle className="text-blue-900">Form Edit Event</CardTitle>
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
                    <div className="mt-1 flex items-center gap-3">
                      {event?.bannerHomepage && !bannerHomepageFile && (
                        <img src={event.bannerHomepage} alt="Current banner" className="w-32 h-20 object-cover rounded" />
                      )}
                      <input
                        ref={homepageBannerRef}
                        type="file"
                        accept="image/*"
                        onChange={handleHomepageBannerChange}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        onClick={() => homepageBannerRef.current?.click()}
                        className="bg-blue-500 hover:bg-blue-600 text-white"
                      >
                        {bannerHomepageFile ? "Ganti File" : "Pilih File Baru"}
                      </Button>
                      <span className="text-sm text-gray-500">
                        {bannerHomepageFile ? bannerHomepageFile.name : "Tidak ada perubahan"}
                      </span>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Banner Halaman Undian 1</Label>
                    <div className="mt-1 flex items-center gap-3">
                      {event?.bannerUndian && !bannerUndianFile && (
                        <img src={event.bannerUndian} alt="Current banner" className="w-32 h-20 object-cover rounded" />
                      )}
                      <input
                        ref={undianBannerRef}
                        type="file"
                        accept="image/*"
                        onChange={handleUndianBannerChange}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        onClick={() => undianBannerRef.current?.click()}
                        className="bg-blue-500 hover:bg-blue-600 text-white"
                      >
                        {bannerUndianFile ? "Ganti File" : "Pilih File Baru"}
                      </Button>
                      <span className="text-sm text-gray-500">
                        {bannerUndianFile ? bannerUndianFile.name : "Tidak ada perubahan"}
                      </span>
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

                  <div>
                    <Label className="text-sm font-medium mb-2 block">Status Event</Label>
                    <select
                      {...register("status")}
                      className="w-full h-10 px-3 rounded-md border border-input bg-background"
                    >
                      <option value="aktif">Aktif</option>
                      <option value="selesai">Selesai</option>
                      <option value="nonaktif">Nonaktif</option>
                    </select>
                    {errors.status && (
                      <p className="text-red-500 text-sm mt-1">{errors.status.message}</p>
                    )}
                  </div>

                  <div>
                    <Label className="text-sm font-medium mb-3 block">Refund Status</Label>
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

                    {event?.ebookFile && (
                      <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-sm text-green-700">
                          ✓ E-book sudah diupload: <strong>{event.ebookTitle || "Tanpa judul"}</strong>
                        </p>
                        <p className="text-xs text-green-600 mt-1">
                          Upload file baru untuk mengganti E-book yang ada
                        </p>
                      </div>
                    )}

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
                      className="bg-blue-600 hover:bg-blue-700 text-white px-8"
                      disabled={updateMutation.isPending}
                    >
                      {updateMutation.isPending ? "Menyimpan..." : "Update Event"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setLocation("/admin/events")}
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



