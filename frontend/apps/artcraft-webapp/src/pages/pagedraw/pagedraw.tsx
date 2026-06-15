import { PageDraw as PageDrawLib } from "@storyteller/ui-pagedraw";
import Seo from "../../components/seo";
import { useWebPageDrawAdapter } from "./web-adapter";

export default function PageDraw() {
  const adapter = useWebPageDrawAdapter();
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
        style={{ transform: "translateZ(0)" }}
      >
        <PageDrawLib adapter={adapter} />
      </div>
    </>
  );
}
