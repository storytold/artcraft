// imeKey: tells a key press that belongs to an IME apart from one meant for the app.
// An IME is the typing helper people use for Japanese, Chinese and Korean: they type sounds, then press Enter to
// confirm the word they picked from the candidate list. That Enter must not also act as "insert a line break" or
// "submit the prompt". The two browser engines report it differently, so both shapes are checked:
//   - Chromium (the Windows app) sends the keydown with isComposing = true.
//   - Safari's engine (the macOS app) ends the composition first, then sends the keydown with keyCode 229.

/** True when this keydown is the IME's (candidate pick, confirm, cancel) rather than a key for the app to act on. */
export function isImeKeyDown(e: {
  keyCode?: number;
  nativeEvent?: { isComposing?: boolean };
}): boolean {
  return e.nativeEvent?.isComposing === true || e.keyCode === 229;
}
