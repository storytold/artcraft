import { Modal } from "@storyteller/ui-modal";
import { useState } from "react";
import { useShowProviderBillingModalEvent } from "@storyteller/tauri-events";
import { GenerationProvider } from "@storyteller/common";
import { GenericProviderBillingBlock } from "./others/GenericProviderBillingBlock";
import { ArtcraftBillingBlock } from "./artcraft/ArtcraftBillingBlock";
import { twMerge } from "tailwind-merge";

interface ProviderBillingModalProps {
}

export function ProviderBillingModal({
}: ProviderBillingModalProps) {
  const [showModal, setShowModal] = useState(false);
  const [provider, setProvider] = useState<GenerationProvider>(GenerationProvider.Artcraft);

  useShowProviderBillingModalEvent(async (event) => {
    console.log("Show provider billing modal event received from Tauri:", event);
    setProvider(event.provider);
    setShowModal(true);
  });

  let block;

  switch (provider) {
    case GenerationProvider.Midjourney:
    case GenerationProvider.Sora:
    case GenerationProvider.Fal:
      // NB: We're just going to ask users to set up billing on the provider's website.
      block = <GenericProviderBillingBlock provider={provider} />;
      break;
    case GenerationProvider.Artcraft:
      block = <ArtcraftBillingBlock />;
      break;
  }

  const isArtcraft = provider === GenerationProvider.Artcraft;

  return (
    <Modal
      isOpen={showModal}
      onClose={() => {
        setShowModal(false);
      }}
      className={twMerge(
        "bg-ui-panel border border-ui-panel-border transition-all duration-300 overflow-y-auto",
        isArtcraft ? "max-w-screen-2xl max-h-[90vh]" : "max-w-2xl max-h-[500px]"
      )}
      showClose={true}
    >
      <div className={twMerge(
        "flex flex-col items-center justify-center",
        isArtcraft ? "h-full w-full" : "gap-6 p-6"
      )}>
        {block}
      </div>
    </Modal>
  );
}

export default ProviderBillingModal;
