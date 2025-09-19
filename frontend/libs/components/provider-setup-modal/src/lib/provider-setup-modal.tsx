import { Modal } from "@storyteller/ui-modal";
import { invoke } from "@tauri-apps/api/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowRight,
  faMagicWandSparkles,
} from "@fortawesome/pro-solid-svg-icons";
import { Button } from "@storyteller/ui-button";
import { useState } from "react";
import { useShowProviderLoginModalEvent } from "@storyteller/tauri-events";
import { GenerationProvider } from "@storyteller/common";

interface ProviderSetupModalProps {
}

export function ProviderSetupModal({
}: ProviderSetupModalProps) {
  const [showModal, setShowModal] = useState(false);
  const [provider, setProvider] = useState<GenerationProvider>(GenerationProvider.Artcraft);

  useShowProviderLoginModalEvent(async (event) => {
    console.log("Show provider login modal event received from Tauri:", event);
    setProvider(event.provider);
    setShowModal(true);
  });

  const serviceProviderName = getServiceProviderName(provider);

  const modalTitle = `Set up ${serviceProviderName}`;
  const modalSubTitle = `Add your ${serviceProviderName} account to ArtCraft!`;

  const modalDescription = `You can add your ${serviceProviderName} account to ArtCraft by simply logging in. Use your credits and account directly within Artcraft. You can add all of your AI accounts to Artcraft to use them all in one place and build the ultimate AI art tool.`;

  const modalButtonText = `Set up ${serviceProviderName}`;

  const buttonOnClick = async () => {
    switch (provider) {
      case GenerationProvider.Midjourney:
        await invoke("midjourney_open_login_command");
        break;
      case GenerationProvider.Sora:
        await invoke("open_sora_login_command"); // TODO: Rename in Tauri
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
      className="max-w-2xl max-h-[500px] p-6"
      showClose={true}
    >
      <div className="flex flex-col items-center justify-center gap-6">
        <div className="flex flex-col items-center gap-3">

          <br />

          <h1 className="text-3xl font-bold">
            <FontAwesomeIcon
              icon={faMagicWandSparkles}
              className="mr-3 text-[24px]"
            />
            {modalTitle}
          </h1>
          <div className="text-center">
            <p className="text-lg font-medium text-white/80">{modalSubTitle}</p>

            <br />

            <p className="text-white/60">{modalDescription}</p>

            <br />

          </div>
        </div>

        {/*<div className="aspect-video w-full overflow-hidden rounded-md">
          Test
        </div>*/}
        <Button
          className="font-semibold"
          icon={faArrowRight}
          iconFlip={true}
          onClick={() => {
            buttonOnClick();
          }}
        >
          {modalButtonText}
        </Button>
      </div>
    </Modal>
  );
}

function getServiceProviderName(provider: GenerationProvider) : string {
  switch (provider) {
    case GenerationProvider.Sora:
      return "Sora";
    case GenerationProvider.Fal:
      return "Fal";
    case GenerationProvider.Midjourney:
      return "Midjourney";
    case GenerationProvider.Artcraft:
    default:
      return "Artcraft";
  }
}

export default ProviderSetupModal;
