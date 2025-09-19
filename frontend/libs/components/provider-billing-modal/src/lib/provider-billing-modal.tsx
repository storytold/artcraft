import { Modal } from "@storyteller/ui-modal";
import { useState } from "react";
import { useShowProviderBillingModalEvent } from "@storyteller/tauri-events";
import { GenerationProvider } from "@storyteller/common";
import { GenericProviderBillingBlock } from "./others/GenericProviderBillingBlock";
import { ArtcraftBillingBlock } from "./artcraft/ArtcraftBillingBlock";

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

  return (
    <Modal
      isOpen={showModal}
      onClose={() => {
        setShowModal(false);
      }}
      className="max-w-2xl max-h-[500px] p-6"
      showClose={true}
    >
      <div className="flex flex-col items-center justify-center gap-6">
        {block}
      </div>
    </Modal>
  );
}

export default ProviderBillingModal;
