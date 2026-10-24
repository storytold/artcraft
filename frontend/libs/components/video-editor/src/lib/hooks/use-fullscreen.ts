import { useCallback, useEffect, useState } from "react";

// Full screen for the preview panel: toggles `containerRef` in and out of full screen and tracks the state.
// Returns isFullscreen (is the document in full screen), isSupported (can this webview do element full screen at
// all) and toggleFullscreen. Used by the preview panel, which draws its Full screen controls only when isSupported.
export function useFullscreen({
  containerRef,
}: {
  containerRef: React.RefObject<HTMLElement | null>;
}) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Whether the webview allows element full screen. The desktop app's macOS webview has it switched OFF unless Tauri's
  // `macos-private-api` feature is on (Tauri docs: macOSPrivateApi "sets the fullScreenEnabled preference to true"),
  // and there document.fullscreenEnabled is false and the element has no working requestFullscreen. Read on every
  // render (a cheap property read), so the controls appear on their own if the app ever turns the feature on.
  const isSupported =
    typeof document !== "undefined" && document.fullscreenEnabled === true;

  useEffect(() => {
    const handleChange = () => {
      setIsFullscreen(document.fullscreenElement !== null);
    };
    document.addEventListener("fullscreenchange", handleChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleChange);
    };
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    // Nothing to do where full screen is unavailable: calling requestFullscreen there throws a TypeError.
    if (!isSupported) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      containerRef.current.requestFullscreen();
    }
  }, [containerRef, isSupported]);

  return { isFullscreen, isSupported, toggleFullscreen };
}
