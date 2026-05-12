import { useLocation, Link } from "react-router-dom";
import { Fragment } from "react";

type Crumb = { label: string; href?: string };

const ROUTE_CRUMBS: Record<string, Crumb[]> = {
  "/": [{ label: "Home" }],
  "/create-image": [{ label: "Create", href: "/" }, { label: "Image" }],
  "/create-video": [{ label: "Create", href: "/" }, { label: "Video" }],
  "/background-change": [
    { label: "Create", href: "/" },
    { label: "Background Change" },
  ],
  "/library": [{ label: "Library" }],
  "/media": [{ label: "Library", href: "/library" }, { label: "Media" }],
  "/pricing": [{ label: "Pricing" }],
  "/support": [{ label: "Support" }],
  "/login": [{ label: "Login" }],
  "/signup": [{ label: "Sign up" }],
  "/forgot-password": [{ label: "Forgot password" }],
  "/welcome": [{ label: "Welcome" }],
  "/onboarding": [{ label: "Onboarding" }],
  "/checkout/success": [
    { label: "Checkout", href: "/pricing" },
    { label: "Success" },
  ],
  "/checkout/cancel": [
    { label: "Checkout", href: "/pricing" },
    { label: "Cancelled" },
  ],
};

function resolveCrumbs(pathname: string): Crumb[] {
  if (ROUTE_CRUMBS[pathname]) return ROUTE_CRUMBS[pathname];
  const matchedKey = Object.keys(ROUTE_CRUMBS).find(
    (k) => k !== "/" && pathname.startsWith(k + "/"),
  );
  return matchedKey ? ROUTE_CRUMBS[matchedKey] : [];
}

export function Breadcrumbs() {
  const { pathname } = useLocation();
  const crumbs = resolveCrumbs(pathname);
  if (crumbs.length === 0) return null;

  return (
    <nav className="hidden md:flex items-center gap-1.5 text-sm text-white/45 min-w-0">
      {crumbs.map((crumb, i) => {
        const isLast = i === crumbs.length - 1;
        return (
          <Fragment key={`${crumb.label}-${i}`}>
            {i > 0 && (
              <span className="text-white/25" aria-hidden>
                ›
              </span>
            )}
            {crumb.href && !isLast ? (
              <Link
                to={crumb.href}
                className="truncate hover:text-white/70 transition-colors"
              >
                {crumb.label}
              </Link>
            ) : (
              <span
                className={isLast ? "text-white/85 truncate" : "truncate"}
                aria-current={isLast ? "page" : undefined}
              >
                {crumb.label}
              </span>
            )}
          </Fragment>
        );
      })}
    </nav>
  );
}
