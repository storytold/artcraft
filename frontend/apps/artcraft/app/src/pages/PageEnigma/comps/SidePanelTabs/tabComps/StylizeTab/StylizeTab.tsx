import { TabTitle } from "~/pages/PageEnigma/comps/SidePanelTabs/sharedComps/TabTitle";
import { PageStyleSelection } from "./PageStyleSelection";
import { Prompts } from "./Prompts";
import { StyleButtons } from "./StyleButtons";
import { useState } from "react";
import { ArtStyle } from "~/pages/PageEnigma/Editor/api_manager";
import { styleList } from "~/pages/PageEnigma/styleList";
import { StylizeTabPages } from "~/pages/PageEnigma/enums";
import { StyleSelectionButton } from "./StyleSelectionButton";
import { GenerateMovieButton } from "./GenerateMovieButton";
import { IPAdapter } from "./IPAdapter";
import { usePageEnigmaStore } from "~/pages/PageEnigma/PageEnigmaStore";

export function StylizeTab() {
  const selectedArtStyle = usePageEnigmaStore((s) => s.selectedArtStyle);
  const setSelectedArtStyle = usePageEnigmaStore((s) => s.setSelectedArtStyle);

  const [view, setView] = useState(StylizeTabPages.MAIN);
  const [generateSectionHeight, setGenerateSectionHeight] = useState(114);

  const currentStyle = styleList.find(
    (style) => style.type === selectedArtStyle,
  );

  // TODO: wire preview refresh to editor.refreshPreview() once editor.ts is migrated.

  const handleSelectStyle = (newSelection: ArtStyle) => {
    setSelectedArtStyle(newSelection);
    setView(StylizeTabPages.MAIN);
  };

  if (view === StylizeTabPages.STYLE_SELECTION) {
    return (
      <PageStyleSelection
        selection={selectedArtStyle}
        setSelection={handleSelectStyle}
        changePage={setView}
      />
    );
  }

  return (
    <div className="flex flex-col overflow-hidden">
      <TabTitle title="Transform your animation with AI" />
      <div
        className="mt-2 flex w-full flex-col gap-3 overflow-y-auto overflow-x-hidden px-4 pb-2"
        style={{ marginBottom: `${generateSectionHeight}px` }}
      >
        <StyleSelectionButton
          onClick={() => setView(StylizeTabPages.STYLE_SELECTION)}
          selectedStyle={selectedArtStyle}
          label={currentStyle?.label || "Select a Style"}
          imageSrc={
            currentStyle?.image ||
            "/resources/placeholders/style_placeholder.png"
          }
        />
        <Prompts />
        <IPAdapter />
        <StyleButtons />
      </div>
      <GenerateMovieButton
        setGenerateSectionHeight={setGenerateSectionHeight}
      />
    </div>
  );
}
