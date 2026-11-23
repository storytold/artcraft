import { ArtcraftAccountBlock } from "./ArtcraftAccountBlock";
import { ProviderAccountBlock } from "./ProviderAccountBlock";
import { GrokGetCredentialInfo, MidjourneyGetCredentialInfo } from "@storyteller/tauri-api";

interface AccountSettingsPaneProps {
  globalAccountLogoutCallback: () => void;
}

export const AccountSettingsPane = ({
  globalAccountLogoutCallback,
}: AccountSettingsPaneProps) => {
  return (
    <div className="flex flex-col gap-5 pt-3 text-base-fg">
      <ArtcraftAccountBlock
        globalAccountLogoutCallback={globalAccountLogoutCallback}
      />
      <hr className="border-ui-panel-border" />
      <ProviderAccountBlock
        name="Grok"
        commandPrefix="grok"
        getCredentialInfo={GrokGetCredentialInfo}
      />
      <hr className="border-ui-panel-border" />
      <ProviderAccountBlock
        name="Midjourney"
        commandPrefix="midjourney"
        getCredentialInfo={MidjourneyGetCredentialInfo}
      />
    </div>
  );
};
