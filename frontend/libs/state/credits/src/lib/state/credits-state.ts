export interface CreditsState {
  // Daily free credits (if/when we offer them)
  freeCredits: number,

  // Credits refilled monthly with a subscription
  monthlyCredits: number,

  // Credits the user purchases individually
  bankedCredits: number,

  // Total credits available
  totalCredits: number,
}

export type CreditsActions = {
  // Call to fetch credits from the server
  fetchFromServer: () => Promise<void>
}

