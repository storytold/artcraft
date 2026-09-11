import type { AuthUser } from "./types";

// Read-only access to the currently signed-in user. The editor uses
// this only for chrome (avatar, display name, share-button gating)
// and never for authorizing requests — those go through the
// project-storage and media-source adapters which are owned by the
// host and already carry whatever auth context they need.
//
// Returns `null` for anonymous / signed-out users. The default impl
// is the anonymous adapter.
export interface AuthUserAdapter {
  currentUser(): AuthUser | null;
  // Optional: lets the editor subscribe to auth-state changes (sign in/out)
  // so it can re-render chrome reactively. If absent, the editor reads
  // the value once at mount and treats it as stable.
  subscribe?(listener: (user: AuthUser | null) => void): () => void;
}
