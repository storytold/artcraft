import { ArtcraftAccountBlock } from "./ArtcraftAccountBlock";
import { MidjourneyAccountBlock } from "./MidjourneyAccountBlock";
import { GrokAccountBlock } from "./GrokAccountBlock";
import { WaveSpeedAccountBlock } from "./WaveSpeedAccountBlock";

interface AccountSettingsPaneProps {
  globalAccountLogoutCallback: () => void;
}

/** Render Artcraft and supported direct-provider account controls, including WaveSpeed key management. */
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
      <WaveSpeedAccountBlock />
    </div>
  );
};
