import { IsDesktopApp } from "./IsDesktopApp";
import { fetch as tauriFetch } from '@tauri-apps/plugin-http'

// TODO: Match the function signature in typescript annotations:
// export declare function fetch(input: URL | Request | string, init?: RequestInit & ClientOptions): Promise<Response>;

/// Third party cookies are blocked on Mac, which means all of our API calls
/// to our backend fail. Fortunately Tauri exposes a drop-in mixin for the 
/// Javascript fetch API that can proxy all requests to Rust, and then onto
/// the downstream service. It maintains its own cookie jar and avoids the 
/// 3rd party cookie issue.
///
/// This function basically determines if we're in Tauri or on the Web. If the
/// former, we replace Fetch with the Tauri fetch. If the latter, we dispatch
/// to the normal browser fetch.

export function FetchProxy(args: any, additionalArgs: any) : Promise<Response> {
  if (IsDesktopApp()) {
    // Tauri proxy fetch
    if (additionalArgs !== undefined) {
      return tauriFetch(args, additionalArgs);
    } else {
      return tauriFetch(args);
    }
  } else {
    // Browser native fetch
    if (additionalArgs !== undefined) {
      return fetch(args, additionalArgs);
    } else {
      return fetch(args);
    }
  }
}

(window as any).FetchProxy = FetchProxy;
