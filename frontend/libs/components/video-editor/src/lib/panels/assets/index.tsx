"use client";

import { Separator } from "../../components/ui/separator";
import { type Tab, useAssetsPanelStore } from "./assets-panel-store";
import { TabBar } from "./tabbar";
// TODO: SoundsView/TextView/StickersView/EffectsView/Captions live in
// sibling modules in opencut-classic
// (@/sounds, @/text, @/stickers, @/effects, @/subtitles). None of those
// React surfaces have been ported into this lib yet — render
// "coming soon" placeholders until they land.
// import { Captions } from "../../subtitles/components/assets-view";
import { MediaView } from "./views/assets";
import { SettingsView } from "./views/settings";
// import { SoundsView } from "../../sounds/components/assets-view";
// import { StickersView } from "../../stickers/components/assets-view";
// import { TextView } from "../../text/components/assets-view";
// import { EffectsView } from "../../effects/components/assets-view";

function ComingSoon({ label }: { label: string }) {
  return (
    <div className="text-muted-foreground p-4">
      {label} view coming soon...
    </div>
  );
}

export function AssetsPanel() {
  const { activeTab } = useAssetsPanelStore();

  const viewMap: Record<Tab, React.ReactNode> = {
    media: <MediaView />,
    sounds: <ComingSoon label="Sounds" />,
    text: <ComingSoon label="Text" />,
    stickers: <ComingSoon label="Stickers" />,
    effects: <ComingSoon label="Effects" />,
    transitions: (
      <div className="text-muted-foreground p-4">
        Transitions view coming soon...
      </div>
    ),
    captions: <ComingSoon label="Captions" />,
    adjustment: (
      <div className="text-muted-foreground p-4">
        Adjustment view coming soon...
      </div>
    ),
    settings: <SettingsView />,
  };

  return (
    <div className="panel bg-background flex h-full rounded-sm border overflow-hidden">
      <TabBar />
      <Separator orientation="vertical" />
      <div className="flex-1 overflow-hidden">{viewMap[activeTab]}</div>
    </div>
  );
}
