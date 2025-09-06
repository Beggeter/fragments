import { tgLogin } from "@/services/authService";
import { useEffect } from "react";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  useEffect(() => {
    const fetchAuth = async () => {
      const res = await tgLogin();
    };
    fetchAuth();
  }, []);

  return <>{children}</>;
};
