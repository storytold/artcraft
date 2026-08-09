import { Modal } from "@storyteller/ui-modal";
import { ArrowRightIcon, WandSparklesIcon } from "lucide-react";
import { Button } from "@storyteller/ui-button";
import { useState } from "react";

interface DemoModalProps {
  title: string;
  subTitle: string;
  description: string;
  videoSrc: string;
  buttonText: string;
  buttonOnClick: () => void;
}

export function DemoModal({
  title,
  subTitle,
  description,
  videoSrc,
  buttonText,
  buttonOnClick,
}: DemoModalProps) {
  const [firstTimeDialogOpen, setFirstTimeDialogOpen] = useState(true);

  return (
    <Modal
      isOpen={firstTimeDialogOpen}
      onClose={() => {
        setFirstTimeDialogOpen(false);
      }}
      className="max-w-4xl p-6"
      showClose={false}
    >
      <div className="flex flex-col items-center justify-center gap-6">
        <div className="flex flex-col items-center gap-3">
          <h1 className="text-3xl font-bold">
            <WandSparklesIcon
              
              className="mr-3 text-[24px]" />
            {title}
          </h1>
          <div className="text-center">
            <p className="text-lg font-medium text-white/80">{subTitle}</p>
            <p className="text-white/60">{description}</p>
          </div>
        </div>

        <div className="aspect-video w-full overflow-hidden rounded-md">
          <video autoPlay muted loop controls={false}>
            <source src={videoSrc} type="video/mp4" />
          </video>
        </div>
        <Button
          className="font-semibold"
          icon={ArrowRightIcon}
          iconFlip={true}
          onClick={() => {
            buttonOnClick();
            setFirstTimeDialogOpen(false);
          }}
        >
          {buttonText}
        </Button>
      </div>
    </Modal>
  );
}

export default DemoModal;
