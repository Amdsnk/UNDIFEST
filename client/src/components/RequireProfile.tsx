import { useEffect } from "react";
import { useLocation } from "wouter";

interface RequireProfileProps {
  children: React.ReactNode;
}

export function RequireProfile({ children }: RequireProfileProps) {
  const [, navigate] = useLocation();

  useEffect(() => {
    const userToken = localStorage.getItem("user_token");
    const userData = localStorage.getItem("user_data");
    
    if (userToken && userData) {
      const user = JSON.parse(userData);
      const isProfileComplete = user.name && user.email && user.city && user.bankName && user.accountNumber;
      
      if (!isProfileComplete) {
        navigate("/complete-profile");
      }
    }
  }, [navigate]);

  return <>{children}</>;
}

