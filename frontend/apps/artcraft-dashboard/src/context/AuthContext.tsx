import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { UsersApi } from "@/api/UsersApi";
import type { UserInfo } from "@/types";

interface AuthContextType {
  user: UserInfo | null;
  isLoading: boolean;
  loginState: (user: UserInfo) => void;
  logoutState: () => void;
  checkSession: (showLoading?: boolean) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkSession = async (showLoading = true): Promise<boolean> => {
    if (showLoading) setIsLoading(true);
    try {
      const api = new UsersApi();
      const response = await api.GetAppState();
      const data = response.data;
      if (response.success && data?.is_logged_in && data.maybe_user_info) {
        if (!data.permissions?.is_moderator) {
          await api.Logout();
          setUser(null);
          return false;
        }
        const info = data.maybe_user_info;
        setUser({
          id: info.user_token,
          username: info.username,
          display_name: info.display_name,
          email: "",
          gravatar_url: info.gravatar_hash
            ? `https://gravatar.com/avatar/${info.gravatar_hash}?s=200&d=404`
            : undefined,
        });
        return true;
      } else {
        setUser(null);
        return false;
      }
    } catch (error) {
      console.error("Failed to check session", error);
      setUser(null);
      return false;
    } finally {
      if (showLoading) setIsLoading(false);
    }
  };

  useEffect(() => {
    checkSession();
  }, []);

  const loginState = (userData: UserInfo) => {
    setUser(userData);
  };

  const logoutState = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, isLoading, loginState, logoutState, checkSession }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
