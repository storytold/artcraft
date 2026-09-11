import { ArtcraftAccountBlock } from "./ArtcraftAccountBlock";
import { MidjourneyAccountBlock } from "./MidjourneyAccountBlock";
import { GrokAccountBlock } from "./GrokAccountBlock";

interface AccountSettingsPaneProps {
  globalAccountLogoutCallback: () => void;
}

export const AccountSettingsPane = ({
  globalAccountLogoutCallback,
}: AccountSettingsPaneProps) => {
  return (
    <div className="space-y-4 text-base-fg">
      <ArtcraftAccountBlock
        globalAccountLogoutCallback={globalAccountLogoutCallback}
      />
      <GrokAccountBlock />
      <MidjourneyAccountBlock />
    </div>
  );
};
