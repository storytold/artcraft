import { useRef } from "react";

// Holds the most recent value passed in. The event hooks subscribe to Tauri
// once (on mount), so they read their callback through this ref; otherwise
// they would keep calling the first render's callback with its stale props/state.
export const useLatestRef = <T>(value: T) => {
  const ref = useRef(value);
  ref.current = value;
  return ref;
};
