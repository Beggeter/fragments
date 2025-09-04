import { tgLogin } from "@/services/authService";
import { useAuthStore } from "@/store/authStore";
import { useEffect } from "react";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { setIsAuthenticated, setUser } = useAuthStore();
  useEffect(() => {
    const fetchAuth = async () => {
      const res = await tgLogin();
      if (res) {
        setIsAuthenticated(true);
        setUser(res);
      }
    };
    fetchAuth();
  }, []);

  return <>{children}</>;
};
