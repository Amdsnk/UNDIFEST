import { useState, useEffect } from "react";
import { User, Mail, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface BuyerData {
  name: string;
  phone: string;
  email: string;
}

interface BuyerDataFormProps {
  onSubmit: (data: BuyerData) => void;
  onBack: () => void;
  isProcessing?: boolean;
  eventPrice?: number;
}

export default function BuyerDataForm({
  onSubmit,
  onBack,
  isProcessing = false,
  eventPrice = 0
}: BuyerDataFormProps) {
  // Pre-fill from logged-in user data if available
  const getInitialData = (): BuyerData => {
    try {
      const userData = localStorage.getItem("user_data");
      if (userData) {
        const user = JSON.parse(userData);
        return {
          name: user.name || "",
          phone: user.phoneNumber || "",
          email: user.email || "",
        };
      }
    } catch {
      // ignore parse errors
    }
    return { name: "", phone: "", email: "" };
  };

  const [formData, setFormData] = useState<BuyerData>(getInitialData);
  const [errors, setErrors] = useState<Partial<BuyerData>>({});

  // FB Pixel: track when buyer form is shown (InitiateCheckout)
  useEffect(() => {
    try {
      (window as any).fbq?.('track', 'InitiateCheckout');
    } catch { /* non-fatal */ }
  }, []);

  const validateForm = (): boolean => {
    const newErrors: Partial<BuyerData> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Nama harus diisi";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Nomor telepon harus diisi";
    } else if (!/^[0-9]{10,15}$/.test(formData.phone.replace(/[\s-]/g, ""))) {
      newErrors.phone = "Nomor telepon tidak valid (10-15 digit)";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email harus diisi";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Format email tidak valid";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // Clean phone number (remove spaces and dashes)
    const cleanedData = {
      ...formData,
      phone: formData.phone.replace(/[\s-]/g, ""),
    };

    onSubmit(cleanedData);
  };

  const handleInputChange = (field: keyof BuyerData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <div className="bg-white rounded-2xl p-6 space-y-6">
      <div className="text-center">
        <h3 className="text-gray-800 text-xl font-bold mb-2">Buyer Data</h3>
        <p className="text-gray-600 text-sm">
          Isi data Anda
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name Input */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <User className="w-4 h-4" />
            Nama Lengkap
          </label>
          <Input
            type="text"
            placeholder="Masukkan nama lengkap"
            value={formData.name}
            onChange={(e) => handleInputChange("name", e.target.value)}
            className={errors.name ? "border-red-500" : ""}
            disabled={isProcessing}
          />
          {errors.name && (
            <p className="text-red-500 text-xs">{errors.name}</p>
          )}
        </div>

        {/* Phone Input */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <Phone className="w-4 h-4" />
            Nomor Telepon
          </label>
          <Input
            type="tel"
            placeholder="08123456789"
            value={formData.phone}
            onChange={(e) => handleInputChange("phone", e.target.value)}
            className={errors.phone ? "border-red-500" : ""}
            disabled={isProcessing}
          />
          {errors.phone && (
            <p className="text-red-500 text-xs">{errors.phone}</p>
          )}
        </div>

        {/* Email Input */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <Mail className="w-4 h-4" />
            Email
          </label>
          <Input
            type="email"
            placeholder="email@example.com"
            value={formData.email}
            onChange={(e) => handleInputChange("email", e.target.value)}
            className={errors.email ? "border-red-500" : ""}
            disabled={isProcessing}
          />
          {errors.email && (
            <p className="text-red-500 text-xs">{errors.email}</p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            disabled={isProcessing}
            className="flex-1 bg-white border-2 border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold"
          >
            Kembali
          </Button>
          <Button
            type="submit"
            disabled={isProcessing}
            className="flex-1 bg-[#4169E1] hover:bg-[#3557C1] text-white font-semibold"
          >
            {isProcessing ? "Memproses..." : "Bayar Sekarang"}
          </Button>
        </div>
      </form>
    </div>
  );
}

