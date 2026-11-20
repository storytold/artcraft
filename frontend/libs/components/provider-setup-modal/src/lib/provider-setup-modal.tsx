import { Modal } from "@storyteller/ui-modal";
import { invoke } from "@tauri-apps/api/core";
import { ArrowRightIcon, WandSparklesIcon } from "lucide-react";
import { Button } from "@storyteller/ui-button";
import { useState } from "react";
import { useShowProviderLoginModalEvent } from "@storyteller/tauri-events";
import { GenerationProvider } from "@storyteller/common";
import { SetWaveSpeedApiKey } from "@storyteller/tauri-api";

interface ProviderSetupModalProps {
}

/** Respond to native provider-login events with API-key setup or the supported provider login flow. */
export function ProviderSetupModal({
}: ProviderSetupModalProps) {
  const [showModal, setShowModal] = useState(false);
  const [provider, setProvider] = useState<GenerationProvider>(GenerationProvider.Artcraft);
  const [apiKey, setApiKey] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useShowProviderLoginModalEvent(async (event) => {
    // Retained native handlers can still emit these events for old tasks.
    if (
      event.provider === GenerationProvider.Sora ||
      event.provider === GenerationProvider.WorldLabs
    ) {
      return;
    }
    console.log("Show provider login modal event received from Tauri:", event);
    setProvider(event.provider);
    setApiKey("");
    setError("");
    setShowModal(true);
  });

  const serviceProviderName = getServiceProviderName(provider);

  const modalTitle = `Set up ${serviceProviderName}`;
  const modalSubTitle = `Add your ${serviceProviderName} account to ArtCraft!`;

  let modalDescription;
  switch (provider) {
    case GenerationProvider.WaveSpeed:
      modalDescription = "Enter your WaveSpeed API key to use supported image and video models with your WaveSpeed credits.";
      break;
    case GenerationProvider.Grok:
      modalDescription = `You can add your ${serviceProviderName} account to ArtCraft by simply logging in. Use can then use it directly within Artcraft. You can add all of your AI accounts to Artcraft to use them all in one place and build the ultimate AI art tool.`;
      break;
    default:
      modalDescription = `You can add your ${serviceProviderName} account to ArtCraft by simply logging in. Use your credits and account directly within Artcraft. You can add all of your AI accounts to Artcraft to use them all in one place and build the ultimate AI art tool.`;
      break;
  }

  const modalButtonText = `Set up ${serviceProviderName}`;

  /** Save WaveSpeed credentials before closing, or launch the supported browser-based provider login. */
  const buttonOnClick = async () => {
    if (provider === GenerationProvider.WaveSpeed) {
      setSaving(true);
      setError("");
      try {
        await SetWaveSpeedApiKey(apiKey);
        setApiKey("");
        setShowModal(false);
      } catch {
        setError("Could not save your WaveSpeed API key. Please try again.");
      } finally {
        setSaving(false);
      }
      return;
    }
    switch (provider) {
      case GenerationProvider.Grok:
        await invoke("grok_open_login_command");
        break;
      case GenerationProvider.Midjourney:
        await invoke("midjourney_open_login_command");
        break;
      case GenerationProvider.Fal:
        break; // TODO: None yet.
      default:
        break;
    }
    setShowModal(false);
  };

  return (
    <Modal
      //title={modalTitle}
      isOpen={showModal}
      onClose={() => {
        setShowModal(false);
      }}
      className="max-w-xl p-6"
      showClose={true}
    >
      <div className="flex flex-col gap-6 text-base-fg">
        <div className="flex flex-col gap-3">
          <p className="hud-label flex items-center gap-2 text-base-fg/55">
            <WandSparklesIcon aria-hidden className="h-3.5 w-3.5" />
            Connect account
          </p>
          <h1 className="font-display text-3xl font-medium leading-[1.05] tracking-[-0.03em]">
            {modalTitle}
          </h1>
          <p className="text-base font-medium text-base-fg/80">
            {modalSubTitle}
          </p>
          <p className="text-sm leading-relaxed text-base-fg/60">
            {modalDescription}
          </p>
        </div>

        {provider === GenerationProvider.WaveSpeed && (
          <input
            aria-label="WaveSpeed API key"
            type="password"
            autoComplete="off"
            value={apiKey}
            onChange={(event) => setApiKey(event.target.value)}
            placeholder="Enter WaveSpeed API key"
            disabled={saving}
            className="rounded border border-ui-panel-border bg-transparent px-3 py-2"
          />
        )}
        {error && <p role="alert">{error}</p>}
        <Button
          disabled={saving || (provider === GenerationProvider.WaveSpeed && !apiKey.trim())}
          className="h-10 px-4"
          icon={ArrowRightIcon}
          iconFlip={true}
          onClick={() => {
            void buttonOnClick();
          }}
        >
          {modalButtonText}
        </Button>
      </div>
    </Modal>
  );
}

/** Return the provider name used in connection guidance, falling back to Artcraft. */
function getServiceProviderName(provider: GenerationProvider) : string {
  switch (provider) {
    case GenerationProvider.Grok:
      return "Grok";
    case GenerationProvider.Fal:
      return "Fal";
    case GenerationProvider.WaveSpeed:
      return "WaveSpeed";
    case GenerationProvider.Midjourney:
      return "Midjourney";
    case GenerationProvider.Higgsfield:
      return "Higgsfield";
    case GenerationProvider.Krea:
      return "Krea";
    case GenerationProvider.Leonardo:
      return "Leonardo";
    case GenerationProvider.Magnific:
      return "Magnific";
    case GenerationProvider.Openart:
      return "OpenArt";
    case GenerationProvider.Picsart:
      return "Picsart";
    case GenerationProvider.Pixverse:
      return "PixVerse";
    case GenerationProvider.Runway:
      return "Runway";
    case GenerationProvider.Artcraft:
    default:
      return "Artcraft";
  }
}

export default ProviderSetupModal;
