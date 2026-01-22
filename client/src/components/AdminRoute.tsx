import { useEffect } from "react";
import { useLocation } from "wouter";

interface AdminRouteProps {
  children: React.ReactNode;
}

export function AdminRoute({ children }: AdminRouteProps) {
  const [, setLocation] = useLocation();

  useEffect(() => {
    const adminToken = localStorage.getItem("admin_token");
    if (!adminToken) {
      setLocation("/admin");
    }
  }, [setLocation]);

  const adminToken = localStorage.getItem("admin_token");
  if (!adminToken) {
    return null; // Don't render until redirect happens
  }

  return <>{children}</>;
}
