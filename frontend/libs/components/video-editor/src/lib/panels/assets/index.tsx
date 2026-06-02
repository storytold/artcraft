"use client";

import { Separator } from "../../components/ui/separator";
import { type Tab, useAssetsPanelStore } from "./assets-panel-store";
import { TabBar } from "./tabbar";
import { MediaView } from "./views/assets";
import { SettingsView } from "./views/settings";
import { SoundsView } from "../../sounds/components/assets-view";
import { StickersView } from "../../stickers/components/assets-view";
import { TextView } from "../../text/components/assets-view";
import { EffectsView } from "../../effects/components/assets-view";

// Captions tab renders a placeholder; depends on the transcription
// subsystem which is deferred per port scope.
function ComingSoon({ label }: { label: string }) {
  return (
    <div className="text-muted-foreground p-4">{label} view coming soon...</div>
  );
}

export function AssetsPanel() {
  const { activeTab } = useAssetsPanelStore();

  const viewMap: Record<Tab, React.ReactNode> = {
    media: <MediaView />,
    sounds: <SoundsView />,
    text: <TextView />,
    stickers: <StickersView />,
    effects: <EffectsView />,
    captions: <ComingSoon label="Captions" />,
    settings: <SettingsView />,
  };

  return (
    <div className="panel bg-background flex h-full rounded-lg border border-ui-panel-border overflow-hidden">
      <TabBar />
      <Separator orientation="vertical" />
      <div className="flex-1 overflow-hidden">{viewMap[activeTab]}</div>
    </div>
  );
}
