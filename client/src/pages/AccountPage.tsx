import { MobileHeader } from "@/components/MobileHeader";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { Footer } from "@/components/Footer";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import loginPicUrl from "@assets/login pic_1763510393431.png";

export default function AccountPage() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [sentOtp, setSentOtp] = useState("");
  const [step, setStep] = useState<"phone" | "otp" | "loggedIn">("phone");
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const { toast } = useToast();
  const [, navigate] = useLocation();

  // Check if already logged in
  useEffect(() => {
    const userToken = localStorage.getItem("user_token");
    const userData = localStorage.getItem("user_data");
    if (userToken && userData) {
      const parsedUser = JSON.parse(userData);
      // Check if profile is complete
      const isProfileComplete = parsedUser.name && parsedUser.email && parsedUser.city && parsedUser.bankName && parsedUser.accountNumber;
      if (!isProfileComplete) {
        // Redirect to profile completion
        navigate("/complete-profile");
        return;
      }
      setUser(parsedUser);
      setStep("loggedIn");
    }
  }, [navigate]);

  const handleSendOTP = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter a valid phone number",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiRequest("/api/users/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber }),
      });

      if (response.success) {
        setSentOtp(response.otp || "");
        setStep("otp");
        // Show appropriate message based on whether OTP is included (demo) or sent via WhatsApp (production)
        if (response.otp) {
          toast({
            title: "OTP Terkirim (Demo)",
            description: `Kode OTP: ${response.otp}`,
          });
        } else {
          toast({
            title: "OTP Terkirim",
            description: response.message || "Silakan cek WhatsApp Anda untuk kode OTP",
          });
        }
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to send OTP",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!otpCode) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter the OTP code",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiRequest("/api/users/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber, otp: otpCode }),
      });

      if (response.success && response.token) {
        // Store user token and data
        localStorage.setItem("user_token", response.token);
        localStorage.setItem("user_data", JSON.stringify(response.user));

        // Check if profile is complete
        const user = response.user;
        const isProfileComplete = user.name && user.email && user.city && user.bankName && user.accountNumber;

        if (!isProfileComplete) {
          // Redirect to profile completion page
          toast({
            title: "Lengkapi Profile",
            description: "Silakan lengkapi data profile Anda",
          });
          navigate("/complete-profile");
          return;
        }

        setUser(user);
        setStep("loggedIn");

        toast({
          title: "Login Successful",
          description: "Welcome to Undifest!",
        });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Invalid OTP code",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user_token");
    localStorage.removeItem("user_data");
    setUser(null);
    setStep("phone");
    setPhoneNumber("");
    setOtpCode("");
    toast({
      title: "Logged Out",
      description: "You have been logged out successfully",
    });
  };

  const handleDeleteAccount = async () => {
    if (!confirm("Apakah Anda yakin ingin menghapus akun? Tindakan ini tidak dapat dibatalkan.")) {
      return;
    }

    if (!confirm("Data akun Anda akan dihapus secara permanen. Lanjutkan?")) {
      return;
    }

    setIsLoading(true);
    try {
      const token = localStorage.getItem("user_token");
      await apiRequest("/api/users/account", {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      // Clear local storage
      localStorage.removeItem("user_token");
      localStorage.removeItem("user_data");
      setUser(null);
      setStep("phone");
      setPhoneNumber("");
      setOtpCode("");

      toast({
        title: "Akun Dihapus",
        description: "Akun Anda telah berhasil dihapus",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Gagal menghapus akun",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#ffffff]">
      <div className="max-w-undifest mx-auto pb-20">
        <MobileHeader />

        <div className="px-4 py-8 bg-[#16202a]">
          {step === "loggedIn" ? (
            /* Logged In View */
            (<div>
              <div className="flex justify-center mb-8">
                <img
                  src={loginPicUrl}
                  alt="Undifest"
                  className="w-64 h-auto object-contain"
                  data-testid="login-banner-image"
                />
              </div>
              <h1 className="text-3xl font-bold text-white mb-8">Akun Saya</h1>
              <div className="bg-[#16202a] rounded-2xl p-6 mb-6 border border-[#00D4FF]/20">
                <div className="mb-4">
                  <p className="text-gray-400 text-sm mb-1">Nama</p>
                  <p className="text-white text-lg font-bold" data-testid="text-name">{user?.name || "-"}</p>
                </div>
                <div className="mb-4">
                  <p className="text-gray-400 text-sm mb-1">Nomor WhatsApp</p>
                  <p className="text-white text-lg font-bold" data-testid="text-phone-number">{user?.phoneNumber}</p>
                </div>
                <div className="mb-4">
                  <p className="text-gray-400 text-sm mb-1">Email</p>
                  <p className="text-white text-lg font-bold" data-testid="text-email">{user?.email || "-"}</p>
                </div>
                <div className="mb-4">
                  <p className="text-gray-400 text-sm mb-1">Kota</p>
                  <p className="text-white text-lg font-bold" data-testid="text-city">{user?.city || "-"}</p>
                </div>
                <div className="mb-4">
                  <p className="text-gray-400 text-sm mb-1">Bank</p>
                  <p className="text-white text-lg font-bold" data-testid="text-bank">{user?.bankName || "-"}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-1">Nomor Rekening</p>
                  <p className="text-white text-lg font-bold" data-testid="text-account">{user?.accountNumber || "-"}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                data-testid="button-logout"
                className="holographic-btn w-full h-16 rounded-2xl text-2xl font-bold"
              >
                Keluar
              </button>

              {/* Delete Account Button */}
              <button
                onClick={handleDeleteAccount}
                disabled={isLoading}
                data-testid="button-delete-account"
                className="w-full mt-6 h-12 rounded-xl text-base font-semibold border-2 border-red-500 text-red-500 hover:bg-red-500/10 disabled:opacity-50"
              >
                {isLoading ? "Menghapus..." : "Hapus Akun"}
              </button>
              <p className="text-gray-500 text-xs text-center mt-2">
                Menghapus akun akan menghapus semua data Anda secara permanen
              </p>
            </div>)
          ) : (
            /* Login Form */
            (<div>
              {/* Hero Illustration */}
              <div className="flex justify-center mb-8 mt-4">
                <img 
                  src={loginPicUrl} 
                  alt="Undifest Login" 
                  className="w-80 h-auto object-contain"
                  data-testid="login-banner-image"
                />
              </div>
              <h1 className="text-4xl font-bold text-white mb-8">Login</h1>
              {/* Phone Number Input */}
              <div className="mb-4 relative">
                <Input
                  type="tel"
                  placeholder="Masukan Nnomr Whatsapp"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  disabled={step === "otp" || isLoading}
                  data-testid="input-phone"
                  className="bg-[#1a2636] border-2 border-[#00D4FF]/40 text-white placeholder:text-gray-500 h-16 rounded-xl text-base px-5 disabled:opacity-50 focus:border-[#00D4FF] transition-colors"
                />
              </div>
              {/* Kirim OTP Link */}
              {step === "phone" && (
                <div className="flex justify-end mb-8">
                  <button
                    onClick={handleSendOTP}
                    disabled={isLoading}
                    data-testid="button-send-otp"
                    className="text-[#00D4FF] text-base font-bold hover:text-[#00D4FF]/80 disabled:opacity-50"
                  >
                    {isLoading ? "Mengirim..." : "Kirim OTP"}
                  </button>
                </div>
              )}
              {/* OTP Input */}
              {step === "otp" && (
                <>
                  <div className="flex justify-end mb-4">
                    <button
                      onClick={handleSendOTP}
                      disabled={isLoading}
                      data-testid="button-resend-otp"
                      className="text-[#00D4FF] text-sm font-semibold hover:text-[#00D4FF]/80 disabled:opacity-50"
                    >
                      Kirim Ulang OTP
                    </button>
                  </div>
                </>
              )}
              <div className={step === "otp" ? "mb-8" : "mb-8"}>
                <Input
                  type="text"
                  placeholder="Kode OTP"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  disabled={step === "phone" || isLoading}
                  data-testid="input-otp"
                  className="bg-[#1a2636] border-2 border-[#00D4FF]/40 text-white placeholder:text-gray-500 h-16 rounded-xl text-base px-5 disabled:opacity-30 focus:border-[#00D4FF] transition-colors"
                />
                {sentOtp && step === "otp" && (
                  <p className="text-xs text-[#00D4FF] mt-2" data-testid="text-demo-otp">Demo OTP: {sentOtp}</p>
                )}
              </div>
              {/* Login Button */}
              <button
                onClick={step === "otp" ? handleLogin : handleSendOTP}
                disabled={isLoading}
                data-testid="button-login"
                className="holographic-btn w-full h-16 rounded-xl text-2xl font-bold disabled:opacity-50"
              >
                {isLoading ? (step === "otp" ? "Memverifikasi..." : "Mengirim...") : "Masuk"}
              </button>
              {step === "otp" && (
                <button
                  onClick={() => { setStep("phone"); setOtpCode(""); setSentOtp(""); }}
                  disabled={isLoading}
                  data-testid="button-back"
                  className="w-full mt-4 text-[#00D4FF] text-base font-semibold hover:text-[#00D4FF]/80"
                >
                  Ubah Nomor
                </button>
              )}
            </div>)
          )}
        </div>

        <Footer />
        <MobileBottomNav />
      </div>
    </div>
  );
}
