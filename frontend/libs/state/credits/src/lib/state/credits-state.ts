import { create } from 'zustand'
import { ArtcraftGetCredits } from "@storyteller/tauri-api";

const SLOW_FETCH_MS = 3000;
const RECOVERED_HOLD_MS = 1000;

export type CreditsIconStatus = 'hidden' | 'slow' | 'failed' | 'recovered';

export interface CreditsState {
  // Daily free credits (if/when we offer them)
  freeCredits: number,

  // Credits refilled monthly with a subscription
  monthlyCredits: number,

  // Credits the user purchases individually
  bankedCredits: number,

  // Total credits available
  totalCredits: number,

  // Drives the status badge on the credits coin in TopBar.
  iconStatus: CreditsIconStatus,
}

export type CreditsActions = {
  // Call to fetch credits from the server
  fetchFromServer: () => Promise<void>
  // Reset all credits to zero (e.g. on logout)
  reset: () => void
}

export const useCreditsState = create<CreditsState & CreditsActions>((set, get) => {
  let token = 0;
  let slowTimer: ReturnType<typeof setTimeout> | null = null;
  let recoveredTimer: ReturnType<typeof setTimeout> | null = null;

  const clearSlowTimer = () => {
    if (slowTimer) { clearTimeout(slowTimer); slowTimer = null; }
  };
  const clearRecoveredTimer = () => {
    if (recoveredTimer) { clearTimeout(recoveredTimer); recoveredTimer = null; }
  };

  return {
    freeCredits: 0,
    monthlyCredits: 0,
    bankedCredits: 0,
    totalCredits: 0,
    iconStatus: 'hidden',

    reset: () => {
      token += 1;
      clearSlowTimer();
      clearRecoveredTimer();
      set({
        freeCredits: 0,
        monthlyCredits: 0,
        bankedCredits: 0,
        totalCredits: 0,
        iconStatus: 'hidden',
      });
    },

    fetchFromServer: async () => {
      const myToken = ++token;
      clearSlowTimer();
      clearRecoveredTimer();

      // The recovered window has served its purpose; start the new cycle clean.
      // Preserve visible 'slow' / 'failed' so the icon doesn't flicker while the
      // new fetch is in flight.
      if (get().iconStatus === 'recovered') {
        set({ iconStatus: 'hidden' });
      }

      slowTimer = setTimeout(() => {
        if (myToken === token) {
          set({ iconStatus: 'slow' });
        }
      }, SLOW_FETCH_MS);

      let data;
      try {
        data = await ArtcraftGetCredits();
      } catch (error) {
        console.error("Error fetching credits", error);
        if (myToken !== token) return;
        clearSlowTimer();
        set({ iconStatus: 'failed' });
        return;
      }

      if (myToken !== token) return;
      clearSlowTimer();

      console.log("Fetched credits from server: ", data);
      if (!data?.payload) {
        set({ iconStatus: 'failed' });
        return;
      }

      const prior = get().iconStatus;
      const wasProblematic = prior === 'slow' || prior === 'failed';
      set({
        freeCredits: data.payload.free_credits,
        monthlyCredits: data.payload.monthly_credits,
        bankedCredits: data.payload.banked_credits,
        totalCredits: data.payload.sum_total_credits,
        iconStatus: wasProblematic ? 'recovered' : 'hidden',
      });

      if (wasProblematic) {
        recoveredTimer = setTimeout(() => {
          if (get().iconStatus === 'recovered') {
            set({ iconStatus: 'hidden' });
          }
          recoveredTimer = null;
        }, RECOVERED_HOLD_MS);
      }
    },
  };
});
