import type { CSSProperties } from "react";
import { PageDraw as PageDrawLib } from "@storyteller/ui-pagedraw";
import Seo from "../../components/seo";
import { useSidebar } from "../../components/ui/sidebar";
import { TopBarActions } from "../../components/topbar/TopBarActions";
import { useWebPageDrawAdapter } from "./web-adapter";

export default function PageDraw() {
  const adapter = useWebPageDrawAdapter();
  // The global top bar is hidden on this route (desktop) so the editor
  // reclaims the full vertical strip — mirror Edit 3D / Video Editor. On
  // mobile the global bar stays, so don't re-host the actions here.
  const { isMobile } = useSidebar();
  return (
    <>
      <Seo
        title="Edit Image - ArtCraft"
        description="Edit and recompose images on an AI canvas, then generate new variations."
      />
      {/* PageDraw lays its canvas and toolbars out with position:fixed.
          translateZ(0) makes this div their containing block so they scope
          to the SidebarInset area instead of covering the whole window —
          same technique the Edit 3D page uses for its lib overlays. */}
      <div
        className="relative h-full w-full overflow-hidden"
        style={
          {
            transform: "translateZ(0)",
            // Recolors the lib's `.pegboard-bg` canvas backdrop (the surface
            // behind the artboard) to the webapp's page color.
            "--st-canvas": "#101014",
            // With the global top bar hidden but the bottom prompt bar still
            // present, the usable canvas area's center sits above the geometric
            // center. Pull the side panels (toolbar + history) up by half the
            // prompt-bar footprint so they read as centered in that area.
            "--pd-bottom-reserve": "4rem",
          } as CSSProperties
        }
      >
        <PageDrawLib
          adapter={adapter}
          backgroundClassName="bg-[#101014]"
          fillParentHeight={!isMobile}
          // Cost/help live in the webapp's own chrome, not over the canvas.
          showBottomRightControls={false}
        />
        {/* With the global top bar hidden on desktop, float the same
            credits / pricing / task-queue / profile cluster in the top-right
            corner so those actions stay reachable while editing. */}
        {!isMobile && (
          <div className="pointer-events-auto fixed right-4 top-3 z-30">
            <TopBarActions />
          </div>
        )}
      </div>
    </>
  );
}
