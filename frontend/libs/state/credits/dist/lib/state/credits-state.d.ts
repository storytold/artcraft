export interface CreditsState {
    freeCredits: number;
    monthlyCredits: number;
    bankedCredits: number;
    totalCredits: number;
}
export type CreditsActions = {
    fetchFromServer: () => Promise<void>;
};
export declare const useCreditsState: import('zustand').UseBoundStore<import('zustand').StoreApi<CreditsState & CreditsActions>>;
//# sourceMappingURL=credits-state.d.ts.map