import { useState } from "react";
import { Button } from "@storyteller/ui-button";
import { Tooltip } from "@storyteller/ui-tooltip";
import { ImagesIcon, UploadIcon } from "lucide-react";
import { UploadModalImage } from "@storyteller/ui-upload-modal";

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
          className={className || "h-[38px] w-[38px]"}
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
