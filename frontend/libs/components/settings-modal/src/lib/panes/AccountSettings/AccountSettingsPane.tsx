import { ArtcraftAccountBlock } from "./ArtcraftAccountBlock";
import { MidjourneyAccountBlock } from "./MidjourneyAccountBlock";
import { GrokAccountBlock } from "./GrokAccountBlock";
import { BytePlusAccountBlock } from "./BytePlusAccountBlock";

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
      <GrokAccountBlock />
      <hr className="border-ui-panel-border" />
      <MidjourneyAccountBlock />
      <hr className="border-ui-panel-border" />
      <BytePlusAccountBlock />
    </div>
  );
};
