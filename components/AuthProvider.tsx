import { tgLogin } from "@/services/authService";
import { useEffect } from "react";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  useEffect(() => {
    tgLogin();
  }, []);

  return <>{children}</>;
};
