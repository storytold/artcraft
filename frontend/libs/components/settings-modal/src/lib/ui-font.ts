// The user's interface font. Unset means the built-in font stacks
// (--st-font-sans and --st-font-display in base.css), which read this variable.
const UI_FONT_STORAGE_KEY = "st-ui-font";
const UI_FONT_CSS_VARIABLE = "--st-ui-font";

export function getStoredUiFont(): string | null {
  const value = (localStorage.getItem(UI_FONT_STORAGE_KEY) || "").trim();
  return value || null;
}

// Applies the font to the whole interface and remembers it.
// Pass null to restore the default fonts. Returns false if the choice
// applies now but couldn't be saved for the next launch.
export function setUiFont(family: string | null): boolean {
  applyUiFont(family);
  try {
    if (family) {
      localStorage.setItem(UI_FONT_STORAGE_KEY, family);
    } else {
      localStorage.removeItem(UI_FONT_STORAGE_KEY);
    }
    return true;
  } catch {
    // Storage can be full or unavailable (QuotaExceededError).
    return false;
  }
}

// Re-applies the stored font; call once at startup.
export function applyStoredUiFont() {
  applyUiFont(getStoredUiFont());
}

function applyUiFont(family: string | null) {
  const root = document.documentElement;
  if (family) {
    root.style.setProperty(UI_FONT_CSS_VARIABLE, quoteFontFamily(family));
  } else {
    root.style.removeProperty(UI_FONT_CSS_VARIABLE);
  }
}

// Family names can contain spaces, digits and quotes; quote them for CSS.
export function quoteFontFamily(family: string): string {
  return `"${family.replace(/["\\]/g, "\\$&")}"`;
}
