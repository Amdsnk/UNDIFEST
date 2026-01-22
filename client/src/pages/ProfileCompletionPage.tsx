import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { indonesiaCities, indonesiaBanks } from "@/lib/indonesiaData";

export default function ProfileCompletionPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [bankName, setBankName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [citySearch, setCitySearch] = useState("");
  const [bankSearch, setBankSearch] = useState("");
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [showBankDropdown, setShowBankDropdown] = useState(false);
  const { toast } = useToast();
  const [, navigate] = useLocation();

  useEffect(() => {
    const userToken = localStorage.getItem("user_token");
    const userData = localStorage.getItem("user_data");
    if (!userToken || !userData) {
      navigate("/account");
      return;
    }
    const user = JSON.parse(userData);
    setPhoneNumber(user.phoneNumber || "");
    // If profile already complete, redirect to account
    if (user.name && user.email && user.city && user.bankName && user.accountNumber) {
      navigate("/account");
    }
  }, [navigate]);

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleSubmit = async () => {
    // Validation
    if (!name.trim()) {
      toast({ variant: "destructive", title: "Error", description: "Nama harus diisi" });
      return;
    }
    if (!validateEmail(email)) {
      toast({ variant: "destructive", title: "Error", description: "Format email tidak valid" });
      return;
    }
    if (!city) {
      toast({ variant: "destructive", title: "Error", description: "Kota harus dipilih" });
      return;
    }
    if (!accountNumber || !/^\d+$/.test(accountNumber)) {
      toast({ variant: "destructive", title: "Error", description: "Nomor rekening hanya boleh angka" });
      return;
    }
    if (!bankName) {
      toast({ variant: "destructive", title: "Error", description: "Bank harus dipilih" });
      return;
    }

    setIsLoading(true);
    try {
      const token = localStorage.getItem("user_token");
      const response = await apiRequest("/api/users/profile", {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ name, email, city, accountNumber, bankName }),
      });

      if (response.success) {
        localStorage.setItem("user_data", JSON.stringify(response.user));
        toast({ title: "Berhasil", description: "Profile berhasil disimpan" });
        navigate("/account");
      }
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: "Gagal menyimpan profile" });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredCities = indonesiaCities.filter(c =>
    c.toLowerCase().includes(citySearch.toLowerCase())
  );

  const filteredBanks = indonesiaBanks.filter(b =>
    b.toLowerCase().includes(bankSearch.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#16202a]">
      <div className="max-w-undifest mx-auto">
        {/* Simple Header without navigation */}
        <div className="bg-gradient-to-r from-[#00D4FF] via-[#7B2FF7] to-[#FF00E5] p-[2px]">
          <div className="bg-[#16202a] px-4 py-4 flex justify-center">
            <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#00D4FF] to-[#FF00E5]">
              Undifest
            </h2>
          </div>
        </div>
        <div className="px-4 py-8 bg-[#16202a]">
          <h1 className="text-2xl font-bold text-white mb-2">Lengkapi Profile Anda</h1>
          <p className="text-gray-300 text-sm mb-6">
            Silakan lengkapi data profile Anda untuk melanjutkan.
            Pastikan semua data yang diisi sudah benar dan sesuai.
          </p>

          {/* Nama */}
          <div className="mb-4">
            <label className="text-gray-300 text-sm mb-1 block">Nama:</label>
            <Input
              type="text"
              placeholder="[Nama mohon sesuai di rekening]"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-white border-2 border-gray-300 text-black placeholder:text-gray-400 h-12 rounded-lg"
            />
          </div>

          {/* No HP/WhatsApp - Auto filled */}
          <div className="mb-4">
            <label className="text-gray-300 text-sm mb-1 block">No hp/Whatsapp:</label>
            <Input
              type="text"
              value={phoneNumber}
              disabled
              className="bg-gray-100 border-2 border-gray-300 text-gray-500 h-12 rounded-lg"
            />
          </div>

          {/* Email */}
          <div className="mb-4">
            <label className="text-gray-300 text-sm mb-1 block">Email:</label>
            <Input
              type="email"
              placeholder="*"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-white border-2 border-gray-300 text-black placeholder:text-gray-400 h-12 rounded-lg"
            />
          </div>

          {/* Kota */}
          <div className="mb-4 relative">
            <label className="text-gray-300 text-sm mb-1 block">Kota:</label>
            <Input
              type="text"
              placeholder="* Ketik untuk mencari kota"
              value={city || citySearch}
              onChange={(e) => { setCitySearch(e.target.value); setCity(""); setShowCityDropdown(true); }}
              onFocus={() => setShowCityDropdown(true)}
              className="bg-white border-2 border-gray-300 text-black placeholder:text-gray-400 h-12 rounded-lg"
            />
            {showCityDropdown && filteredCities.length > 0 && (
              <div className="absolute z-50 w-full bg-white border-2 border-gray-300 rounded-lg mt-1 max-h-48 overflow-y-auto">
                {filteredCities.map((c) => (
                  <div
                    key={c}
                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-black"
                    onClick={() => { setCity(c); setCitySearch(""); setShowCityDropdown(false); }}
                  >
                    {c}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* No Rekening dan Bank */}
          <div className="mb-4">
            <label className="text-gray-300 text-sm mb-1 block">No. Rekening:</label>
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="* [norek]"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ''))}
                className="bg-white border-2 border-gray-300 text-black placeholder:text-gray-400 h-12 rounded-lg flex-1"
              />
              <div className="relative flex-1">
                <Input
                  type="text"
                  placeholder="* [Bank]"
                  value={bankName || bankSearch}
                  onChange={(e) => { setBankSearch(e.target.value); setBankName(""); setShowBankDropdown(true); }}
                  onFocus={() => setShowBankDropdown(true)}
                  className="bg-white border-2 border-gray-300 text-black placeholder:text-gray-400 h-12 rounded-lg"
                />
                {showBankDropdown && filteredBanks.length > 0 && (
                  <div className="absolute z-50 w-full bg-white border-2 border-gray-300 rounded-lg mt-1 max-h-48 overflow-y-auto">
                    {filteredBanks.map((b) => (
                      <div
                        key={b}
                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-black text-sm"
                        onClick={() => { setBankName(b); setBankSearch(""); setShowBankDropdown(false); }}
                      >
                        {b}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <p className="text-[#00D4FF] text-sm mb-6 text-center">*Pastikan data sudah benar</p>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="w-full h-14 rounded-2xl text-xl font-bold border-2 border-[#ff3366] text-[#ff3366] hover:bg-[#ff3366]/10 disabled:opacity-50"
          >
            {isLoading ? "Menyimpan..." : "Selesai"}
          </button>
        </div>
      </div>
    </div>
  );
}

