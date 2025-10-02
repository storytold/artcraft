import { ArtcraftGetCredits } from "@storyteller/tauri-api";
import { CreditsState, CreditsActions } from "@storyteller/credits";
import { create } from "zustand";

export const useCreditsState = create<CreditsState & CreditsActions>((set) => ({
  freeCredits: 0,
  monthlyCredits: 0,
  bankedCredits: 0,
  totalCredits: 0,

  // Call to fetch credits from the server
  fetchFromServer: async () => {
    let data;
    try {
      data = await ArtcraftGetCredits();
    } catch (error) {
      console.error("Error fetching credits", error);
      return;
    }
    console.log("Fetched credits from server: ", data);
    if (data.payload) {
      set((state) => ({
        freeCredits: data.payload.free_credits,
        monthlyCredits: data.payload.monthly_credits,
        bankedCredits: data.payload.banked_credits,
        totalCredits: data.payload.sum_total_credits,
      }));
    }
  }
}))
