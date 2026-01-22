import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#0a1621]">
      <Card className="w-full max-w-md mx-4 bg-[#1a2332] border-[#8B2FC9]/30">
        <CardContent className="pt-6">
          <div className="flex mb-4 gap-2">
            <AlertCircle className="h-8 w-8 text-[#FF1493]" />
            <h1 className="text-2xl font-bold text-white">404 Halaman Tidak Ditemukan</h1>
          </div>

          <p className="mt-4 text-sm text-gray-400">
            Halaman yang Anda cari tidak dapat ditemukan.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
