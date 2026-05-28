import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { MessageCircle, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface SendWADialogProps {
  phoneNumber: string;
  recipientName?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SendWADialog({
  phoneNumber,
  recipientName,
  open,
  onOpenChange,
}: SendWADialogProps) {
  const [message, setMessage] = useState("");
  const { toast } = useToast();

  const sendMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("/api/admin/send-whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber, message }),
      });
    },
    onSuccess: () => {
      toast({
        title: "✅ Pesan terkirim!",
        description: `Pesan WA berhasil dikirim ke ${recipientName || phoneNumber}`,
      });
      setMessage("");
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Gagal kirim pesan",
        description: error?.message || "Terjadi kesalahan. Cek konfigurasi Fonnte di Settings.",
      });
    },
  });

  const handleSend = () => {
    if (!message.trim()) {
      toast({ variant: "destructive", title: "Pesan tidak boleh kosong" });
      return;
    }
    sendMutation.mutate();
  };

  const handleClose = () => {
    setMessage("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-green-700">
            <MessageCircle className="w-5 h-5" />
            Kirim Pesan WhatsApp
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3">
            <p className="text-xs text-green-600 font-medium mb-0.5">Penerima</p>
            <p className="font-semibold text-green-900">
              {recipientName && <span className="mr-1">{recipientName}</span>}
              <span className="font-mono text-sm">{phoneNumber}</span>
            </p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">
              Isi Pesan
            </label>
            <Textarea
              placeholder="Tulis pesan yang ingin dikirim ke peserta..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={6}
              className="resize-none border-gray-300 focus:border-green-500 focus:ring-green-500"
            />
            <p className="text-xs text-gray-400 mt-1 text-right">{message.length} karakter</p>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2 text-xs text-yellow-700">
            💡 Gunakan *teks* untuk cetak tebal, _teks_ untuk miring di WhatsApp.
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose} disabled={sendMutation.isPending}>
            <X className="w-4 h-4 mr-1" />
            Batal
          </Button>
          <Button
            onClick={handleSend}
            disabled={sendMutation.isPending || !message.trim()}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {sendMutation.isPending ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Mengirim...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-1" />
                Kirim Pesan
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface SendWAButtonProps {
  phoneNumber: string;
  recipientName?: string;
  size?: "sm" | "default";
  variant?: "ghost" | "outline" | "default";
  className?: string;
}

export function SendWAButton({
  phoneNumber,
  recipientName,
  size = "sm",
  variant = "ghost",
  className = "",
}: SendWAButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={() => setOpen(true)}
        className={`text-green-600 hover:text-green-800 hover:bg-green-50 ${className}`}
        title={`Kirim pesan WA ke ${phoneNumber}`}
      >
        <MessageCircle className="w-4 h-4" />
      </Button>
      <SendWADialog
        phoneNumber={phoneNumber}
        recipientName={recipientName}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}
