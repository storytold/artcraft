import { Link, useLocation } from "react-router-dom";
import { SidebarTrigger, useSidebar } from "../ui/sidebar";
import { GalleryViewToggle } from "../generation-gallery/GalleryViewToggle";
import { Breadcrumbs } from "./breadcrumbs";
import { TopBarActions } from "./TopBarActions";

// Create pages whose generation feed supports the grid/list layout toggle.
const GALLERY_VIEW_ROUTES = new Set(["/create-image", "/create-video"]);

export function TopBar() {
  const { state, isMobile } = useSidebar();
  const { pathname } = useLocation();
  const showTopbarLogo = isMobile || state === "collapsed";
  // On mobile the toggle lives next to the Generate/History tabs (see
  // CreateMediaPageShell), so keep it out of the top bar there.
  const showViewToggle = !isMobile && GALLERY_VIEW_ROUTES.has(pathname);

  return (
    <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-white/[0.06] bg-[#121212]/80 backdrop-blur-md px-3 pb-4 pt-3 sm:pt-6">
      {/* Left: sidebar trigger (mobile only) + logo (when sidebar closed) + breadcrumbs */}
      <div className="flex items-center gap-2 min-w-0 shrink-0">
        <SidebarTrigger className="md:hidden" />
        <div className="flex gap-6 h-8">
          {showTopbarLogo && (
            <Link to="/" className="flex items-center shrink-0">
              {/* The wordmark is too wide on phones — use the square icon there. */}
              <img
                src={
                  isMobile
                    ? "/images/artcraft-icon.png"
                    : "/images/artcraft-logo.png"
                }
                alt="ArtCraft"
                className={isMobile ? "h-5 w-auto" : "h-5 w-auto"}
              />
            </Link>
          )}
          <Breadcrumbs />
        </div>
      </div>

      {/* Right: gallery layout toggle (create pages) + credits / upgrade / task queue / avatar */}
      <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
        {showViewToggle && <GalleryViewToggle />}
        <TopBarActions />
      </div>
    </header>
  );
}
