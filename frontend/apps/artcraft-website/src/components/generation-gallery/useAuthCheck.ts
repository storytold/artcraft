import { useCallback, useEffect, useState } from "react";
import { UsersApi, type UserInfo } from "@storyteller/api";

export function useAuthCheck() {
  const [user, setUser] = useState<UserInfo | undefined>(undefined);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      const api = new UsersApi();
      const response = await api.GetSession();
      if (response.success && response.data?.loggedIn && response.data.user) {
        setUser(response.data.user);
      }
      setAuthChecked(true);
    };
    checkSession();

    const handleAuthChange = () => checkSession();
    window.addEventListener("auth-change", handleAuthChange);
    return () => window.removeEventListener("auth-change", handleAuthChange);
  }, []);

  return { user, authChecked };
}
