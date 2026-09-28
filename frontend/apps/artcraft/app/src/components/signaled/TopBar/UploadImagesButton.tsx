import { useState } from "react";
import { Button } from "@storyteller/ui-button";
import { Tooltip } from "@storyteller/ui-tooltip";
import { ImagesIcon, UploadIcon } from "lucide-react";
import { UploadModalImage } from "@storyteller/ui-upload-modal";
import { twMerge } from "tailwind-merge";

interface Props {
  className?: string;
}

export const UploadImagesButton = ({ className }: Props) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Tooltip content="Upload images" position="bottom" delay={300}>
        <Button
          variant="secondary"
          icon={UploadIcon}
          iconClassName="h-4 w-4 shrink-0"
          className={twMerge(
            "h-8 w-8 rounded-[3px] border border-white/15 bg-transparent p-0 text-white/80 shadow-none hover:border-white/30 hover:bg-white/10",
            className,
          )}
          onClick={() => setIsOpen(true)}
        />
      </Tooltip>
      <UploadModalImage
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onSuccess={() => setIsOpen(false)}
        title="Upload an Image"
        titleIcon={ImagesIcon}
      />
    </>
  );
};
