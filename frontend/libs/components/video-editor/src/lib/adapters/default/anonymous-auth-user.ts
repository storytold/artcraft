import type { AuthUserAdapter } from "../auth-user";

// Default auth adapter — reports no signed-in user. Hosts override
// this with an adapter that reads their real auth state (cookie,
// Tauri session, etc.).
export const anonymousAuthUser: AuthUserAdapter = {
  currentUser: () => null,
};
