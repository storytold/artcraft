import { Link } from "react-router-dom";
import { SidebarTrigger, useSidebar } from "../ui/sidebar";
import { Breadcrumbs } from "./breadcrumbs";
import { TopBarActions } from "./TopBarActions";

export function TopBar() {
  const { state, isMobile } = useSidebar();
  const showTopbarLogo = isMobile || state === "collapsed";

  return (
    <header className="sticky top-0 z-20 relative flex items-center gap-3 border-b border-white/[0.06] bg-[#121212]/80 backdrop-blur-md px-3 pb-4 pt-3 sm:pt-6">
      {/* Left: sidebar trigger (mobile only) + logo (when sidebar closed) + breadcrumbs */}
      <div className="flex items-center gap-2 min-w-0 shrink-0">
        <SidebarTrigger className="md:hidden" />
        <div className="flex gap-6">
          {showTopbarLogo && (
            <Link to="/" className="flex items-center shrink-0">
              <img
                src="/images/artcraft-logo.png"
                alt="ArtCraft"
                className="h-4 sm:h-5 w-auto"
              />
            </Link>
          )}
          <Breadcrumbs />
        </div>
      </div>

      {/* Right: credits / upgrade / task queue / avatar */}
      <TopBarActions className="ml-auto" />
    </header>
  );
}
