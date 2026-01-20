import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  Calendar,
  Users,
  Trophy,
  FileText,
  Shield,
  CreditCard,
  CheckSquare,
  Image,
  Handshake,
  Landmark,
  Settings,
  FileQuestion,
  Info,
  Wrench,
  Archive,
  Save,
  LogOut,
  CircleUser,
  Video,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { Separator } from "@/components/ui/separator";
import { getCurrentRole } from "@/lib/roleUtils";
import { useMemo } from "react";

const mainMenuItems = [
  { title: "Dashboard", url: "/admin/dashboard", icon: LayoutDashboard, id: "dashboard" },
  { title: "Daftar Event", url: "/admin/events", icon: Calendar, id: "events" },
  { title: "Event Manager", url: "/admin/event-manager", icon: Settings, id: "events" },
  { title: "Member", url: "/admin/members", icon: Users, id: "members" },
  { title: "Nominasi Winner", url: "/admin/winners", icon: Trophy, id: "winners" },
  { title: "Daftar Transaksi", url: "/admin/transactions", icon: CreditCard, id: "transactions" },
  { title: "Daftar Transfer", url: "/admin/daftar-transfer", icon: CreditCard, id: "daftar-transfer" },
  { title: "Laporan", url: "/admin/reports", icon: FileText, id: "reports" },
];

const contentMenuItems = [
  { title: "Slideshow / Banner", url: "/admin/banners", icon: Image, id: "banners" },
  { title: "Videos", url: "/admin/videos", icon: Video, id: "videos" },
  { title: "Partner", url: "/admin/partners", icon: Handshake, id: "partners" },
  { title: "How it Works", url: "/admin/how-it-works", icon: Wrench, id: "how-it-works" },
  { title: "Footer", url: "/admin/footer", icon: Archive, id: "footer" },
];

const settingsMenuItems = [
  { title: "Admin Management", url: "/admin/admin-management", icon: Shield, id: "admin-management" },
  { title: "Edit Lain-Lain", url: "/admin/edit-lain2", icon: Settings, id: "edit-lain2" },
  { title: "IP Whitelist", url: "/admin/ip-whitelist", icon: Shield, id: "ip-whitelist" },
  { title: "Bank", url: "/admin/banks", icon: Landmark, id: "banks" },
  { title: "Akun Method", url: "/admin/account-method", icon: Settings, id: "payment-methods" },
  { title: "Kebijakan", url: "/admin/policy", icon: FileQuestion, id: "pages" },
  { title: "Tentang Kami", url: "/admin/about", icon: Info, id: "pages" },
  { title: "Konfirmasi Website", url: "/admin/website-confirm", icon: CheckSquare, id: "website-confirm" },
];

export function AdminSidebar() {
  const [location, setLocation] = useLocation();
  const currentRole = getCurrentRole();

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_user");
    localStorage.removeItem("admin_info");
    setLocation("/admin");
  };

  const isActive = (url: string) => location === url;

  // Filter menu items based on role
  const visibleMainMenu = useMemo(() => {
    if (currentRole === "superadmin") return mainMenuItems;
    if (currentRole === "qs_custom") {
      return mainMenuItems.filter(item =>
        ["dashboard", "members", "winners", "transactions", "daftar-transfer", "reports"].includes(item.id)
      );
    }
    if (currentRole === "viewer") return mainMenuItems;
    return mainMenuItems;
  }, [currentRole]);

  const visibleContentMenu = useMemo(() => {
    if (currentRole === "superadmin") return contentMenuItems;
    if (currentRole === "qs_custom") return []; // QS Custom doesn't see content menu
    if (currentRole === "viewer") return contentMenuItems;
    return contentMenuItems;
  }, [currentRole]);

  const visibleSettingsMenu = useMemo(() => {
    if (currentRole === "superadmin") return settingsMenuItems;
    if (currentRole === "qs_custom") return []; // QS Custom doesn't see settings menu
    if (currentRole === "viewer") return settingsMenuItems.filter(item => item.id !== "admin-management");
    return settingsMenuItems;
  }, [currentRole]);

  return (
    <Sidebar className="border-r bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
      <SidebarHeader className="p-6 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <CircleUser className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-white font-bold text-lg">Admin Panel</h2>
            <p className="text-white/80 text-xs">Undifest Platform</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-3 py-4">
        <SidebarGroup>
          <SidebarGroupLabel className="text-gray-400 text-xs uppercase tracking-wider px-3 mb-2">
            Main Menu
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {visibleMainMenu.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link href={item.url}>
                      <div
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                          isActive(item.url)
                            ? "bg-blue-600 text-white shadow-lg shadow-blue-600/50"
                            : "text-gray-300 hover:bg-gray-800 hover:text-white"
                        }`}
                        data-testid={`menu-${item.title.toLowerCase().replace(/\s+/g, "-")}`}
                      >
                        <item.icon className="w-4 h-4" />
                        <span className="text-sm font-medium">{item.title}</span>
                      </div>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {visibleContentMenu.length > 0 && (
          <>
            <Separator className="my-4 bg-gray-700" />
            <SidebarGroup>
              <SidebarGroupLabel className="text-gray-400 text-xs uppercase tracking-wider px-3 mb-2">
                Content Management
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="space-y-1">
                  {visibleContentMenu.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link href={item.url}>
                      <div 
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                          isActive(item.url)
                            ? "bg-blue-600 text-white shadow-lg shadow-blue-600/50"
                            : "text-gray-300 hover:bg-gray-800 hover:text-white"
                        }`}
                        data-testid={`menu-${item.title.toLowerCase().replace(/\s+/g, "-")}`}
                      >
                        <item.icon className="w-4 h-4" />
                        <span className="text-sm font-medium">{item.title}</span>
                      </div>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
          </>
        )}

        {visibleSettingsMenu.length > 0 && (
          <>
            <Separator className="my-4 bg-gray-700" />
            <SidebarGroup>
              <SidebarGroupLabel className="text-gray-400 text-xs uppercase tracking-wider px-3 mb-2">
                Settings
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="space-y-1">
                  {visibleSettingsMenu.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link href={item.url}>
                      <div 
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                          isActive(item.url)
                            ? "bg-blue-600 text-white shadow-lg shadow-blue-600/50"
                            : "text-gray-300 hover:bg-gray-800 hover:text-white"
                        }`}
                        data-testid={`menu-${item.title.toLowerCase().replace(/\s+/g, "-")}`}
                      >
                        <item.icon className="w-4 h-4" />
                        <span className="text-sm font-medium">{item.title}</span>
                      </div>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
          </>
        )}
      </SidebarContent>

      <SidebarFooter className="p-3 border-t border-gray-700">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleLogout}>
              <div 
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all cursor-pointer w-full"
                data-testid="menu-logout"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm font-medium">Logout</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
