import { createContext, useContext } from "react";

export type MobileCreateTab = "generate" | "history";

interface MobileCreateTabsValue {
  tab: MobileCreateTab;
  setTab: (tab: MobileCreateTab) => void;
  // Switch to the History tab — called by the form after a generation starts.
  goToHistory: () => void;
}

const MobileCreateTabsContext = createContext<MobileCreateTabsValue>({
  tab: "generate",
  setTab: () => {},
  goToHistory: () => {},
});

export const MobileCreateTabsProvider = MobileCreateTabsContext.Provider;

export function useMobileCreateTabs(): MobileCreateTabsValue {
  return useContext(MobileCreateTabsContext);
}
