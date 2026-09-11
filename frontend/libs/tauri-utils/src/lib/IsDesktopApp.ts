
export function IsDesktopApp(): boolean {
  if (typeof window !== 'undefined') {
    if ('__TAURI_INTERNALS__' in window) {
      return true;
    } else if ('__TAURI__' in window) {
      return true;
    }
  }
  return false;
}

(window as any).IsDesktopApp = IsDesktopApp;
