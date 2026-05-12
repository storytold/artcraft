import { SoraAccountBlock } from "./SoraAccountBlock";
import { ArtcraftAccountBlock } from "./ArtcraftAccountBlock";
import { MidjourneyAccountBlock } from "./MidjourneyAccountBlock";
import { GrokAccountBlock } from "./GrokAccountBlock";
import { WorldLabsAccountBlock } from "./WorldLabsAccountBlock";

interface AccountSettingsPaneProps {
  globalAccountLogoutCallback: () => void;
}

export const AccountSettingsPane = ({
  globalAccountLogoutCallback,
}: AccountSettingsPaneProps) => {
  return (
    <>
      <div className="space-y-4 text-base-fg">
        {/*
        <div className="flex justify-between">
          <span>ArtCraft Account:</span>
          <span className="text-white/80">{accountInfo.username}</span>
        </div>
        <div className="flex justify-between">
          <span>ArtCraft Subscription:</span>
          <span className="text-white/80">{accountInfo.subscription}</span>
        </div>
        <div className="flex justify-between">
          <span>Credits Remaining:</span>
          <span className="text-white/80">{accountInfo.credits}</span>
        </div>

        <div className="rounded-md p-4 text-sm dark:bg-white/5">
          <p className="text-white/60">
            Note: You can optionally log into other accounts and use your
            credits at those providers. Some features are only available via 3rd
            party accounts, such as OpenAI / Sora GPT 4.0 Images. For other
            features, ArtCraft credits are consumed unless you log into your
            third party account.
          </p>
        </div>
        */}

        <ArtcraftAccountBlock
          globalAccountLogoutCallback={globalAccountLogoutCallback}
        />
        <GrokAccountBlock />
        <MidjourneyAccountBlock />
        <SoraAccountBlock />
        <WorldLabsAccountBlock />
        {/*
        <OpenAIApiKeyBlock/>
        <hr />

        <h2>Coming Soon...</h2>

        <div className="flex justify-between items-center">
          <span>Google / Veo Account:</span>
          <Button variant="secondary" disabled className="h-[30px]">
            Connect
          </Button>
        </div>

        <div className="flex justify-between items-center">
          <span>Midjourney Account:</span>
          <Button variant="secondary" disabled className="h-[30px]">
            Connect
          </Button>
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="kling-api-key" className="mb-2 block">
              Kling API Key (optional)
            </label>
            <Input
              id="kling-api-key"
              type="password"
              value={klingApiKey}
              onChange={(e) => setKlingApiKey((e.target as any).value)}
              placeholder="Enter API Key"
              disabled
            />
          </div>
          <div>
            <label htmlFor="pal-api-key" className="mb-2 block">
              Fal API Key (optional)
            </label>
            <Input
              id="pal-api-key"
              type="password"
              value={palApiKey}
              onChange={(e) => setPalApiKey((e.target as any).value)}
              placeholder="Enter API Key"
              disabled
            />
          </div>
          <div>
            <label htmlFor="pal-api-key" className="mb-2 block">
              Replicate API Key (optional)
            </label>
            <Input
              id="pal-api-key"
              type="password"
              value={palApiKey}
              onChange={(e) => setPalApiKey((e.target as any).value)}
              placeholder="Enter API Key"
              disabled
            />
          </div>
        </div>
        */}
      </div>
    </>
  );
};
