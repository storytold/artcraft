import { useEffect } from "react";
import { useLocation, useParams } from "react-router-dom";
import { WEBAPP_URL } from "../config/links";

interface WebappRedirectProps {
  // Target path on the webapp, e.g. "/login" or "/library/:filter".
  // `:param` tokens are substituted from the current route's URL params.
  to: string;
}

// Hard-redirects to the webapp at the matching path, preserving any query
// string and hash so referral/UTM context (and Stripe return params) survive
// the hop. Renders a small spinner while the browser navigates.
export function WebappRedirect({ to }: WebappRedirectProps) {
  const params = useParams();
  const location = useLocation();

  useEffect(() => {
    let resolved = to;
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) {
        resolved = resolved.replace(`:${key}`, encodeURIComponent(value));
      }
    }
    // Strip any unfilled :param segments.
    resolved = resolved.replace(/\/?:\w+/g, "");
    const target = `${WEBAPP_URL}${resolved.replace(/^\//, "")}${location.search}${location.hash}`;
    window.location.replace(target);
  }, [to, params, location.search, location.hash]);

  return (
    <div className="relative min-h-screen bg-[#101014] text-white flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />
    </div>
  );
}
