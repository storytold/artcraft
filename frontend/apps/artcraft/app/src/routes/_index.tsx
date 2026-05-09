import type { HeadersFunction } from "@remix-run/deno";
import { withProtectionRoute } from "~/hoc/withProtectedRoute";
import { MainApp } from "~/pages/MainApp";

// NB(bt): Netlify's custom directives cannot set headers for pages served by Remix,
// so we must specify them here instead. Netlify header rules (in either _headers or
// netlify.toml) will apply to statically served files (images, css, js), however.
// Setting these headers in `vite.config.ts` will also fail to apply them in
// production.
export const headers: HeadersFunction = ({
  actionHeaders,
  errorHeaders,
  loaderHeaders,
  parentHeaders,
}) => ({
  // NB(bt): The following two headers are required for enabling SharedArrayBuffer (required by
  // ffmpeg.wasm) in the post-SPECTRE world. Without these headers being sent by the page, the
  // page cannot use SharedArrayBuffer. Downstream services must also set relevant CORS headers.
  //
  // See the following documentation on how this complex system works:
  //
  //  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/SharedArrayBuffer#security_requirements
  //  - https://stackoverflow.com/questions/73275184/enable-shared-array-buffer-in-cross-domain
  //  - https://blog.logrocket.com/understanding-sharedarraybuffer-and-cross-origin-isolation/
  //  - https://github.com/ffmpegwasm/react-app/issues/3
  //
  // "Cross-Origin-Embedder-Policy": "require-corp",
  // "Cross-Origin-Opener-Policy": "same-origin",
});

const Index = withProtectionRoute(() => <MainApp />);

export default Index;
