import { useSession } from "../../lib/session";

export function useAuthCheck() {
  const { user, authChecked } = useSession();
  return { user, authChecked };
}
