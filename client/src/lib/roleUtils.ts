// Role-based access control utilities

export type AdminRole = "superadmin" | "qs_custom" | "viewer";

export interface AdminInfo {
  id: string;
  username: string;
  name?: string;
  role: AdminRole;
}

// Get current admin info from localStorage
export function getCurrentAdmin(): AdminInfo | null {
  const adminStr = localStorage.getItem("admin_info");
  if (!adminStr) return null;
  try {
    return JSON.parse(adminStr);
  } catch {
    return null;
  }
}

// Get current admin role
export function getCurrentRole(): AdminRole | null {
  const admin = getCurrentAdmin();
  return admin?.role || null;
}

// Check if current admin has specific role
export function hasRole(...roles: AdminRole[]): boolean {
  const currentRole = getCurrentRole();
  if (!currentRole) return false;
  
  // Superadmin always has access
  if (currentRole === "superadmin") return true;
  
  return roles.includes(currentRole);
}

// Check if current admin can write (create/update/delete)
export function canWrite(): boolean {
  const role = getCurrentRole();
  return role === "superadmin" || role === "qs_custom";
}

// Check if current admin can only read
export function isReadOnly(): boolean {
  const role = getCurrentRole();
  return role === "viewer";
}

// Check if current admin can manage other admins
export function canManageAdmins(): boolean {
  return hasRole("superadmin");
}

// Check if current admin can manage winners
export function canManageWinners(): boolean {
  return hasRole("superadmin", "qs_custom");
}

// Check if current admin can manage events
export function canManageEvents(): boolean {
  return hasRole("superadmin");
}

// Check if current admin can manage participants
export function canManageParticipants(): boolean {
  return hasRole("superadmin", "qs_custom");
}

// Get role display name
export function getRoleDisplayName(role: AdminRole): string {
  const roleNames = {
    superadmin: "Superadmin",
    qs_custom: "QS Custom",
    viewer: "Viewer",
  };
  return roleNames[role] || role;
}

// Get role badge color
export function getRoleBadgeColor(role: AdminRole): string {
  const colors = {
    superadmin: "bg-red-100 text-red-800 border-red-200",
    qs_custom: "bg-blue-100 text-blue-800 border-blue-200",
    viewer: "bg-gray-100 text-gray-800 border-gray-200",
  };
  return colors[role] || colors.viewer;
}

// Menu items visibility based on role
export function getVisibleMenuItems(role: AdminRole | null): string[] {
  if (!role) return [];
  
  // Superadmin sees everything
  if (role === "superadmin") {
    return [
      "dashboard",
      "events",
      "banners",
      "members",
      "transactions",
      "winners",
      "videos",
      "reports",
      "partners",
      "how-it-works",
      "banks",
      "footer",
      "ip-whitelist",
      "payment-methods",
      "pages",
      "website-confirm",
      "edit-lain2",
      "admin-management",
      "daftar-transfer",
    ];
  }
  
  // QS Custom only sees participants, tickets, and winners
  if (role === "qs_custom") {
    return [
      "dashboard",
      "members",
      "transactions",
      "winners",
      "reports",
      "daftar-transfer",
    ];
  }
  
  // Viewer sees everything but read-only
  if (role === "viewer") {
    return [
      "dashboard",
      "events",
      "banners",
      "members",
      "transactions",
      "winners",
      "videos",
      "reports",
      "partners",
      "how-it-works",
      "banks",
      "footer",
      "payment-methods",
      "pages",
      "daftar-transfer",
    ];
  }
  
  return [];
}

