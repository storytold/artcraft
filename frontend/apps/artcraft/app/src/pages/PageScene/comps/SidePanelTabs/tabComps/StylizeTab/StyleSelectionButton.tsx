import { faChevronRight } from "@fortawesome/pro-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect, useState } from "react";
import { H4, Label } from "~/components";
import { ArtStyle } from "~/pages/PageScene/enums";

interface StyleSelectionButtonProps {
  onClick: () => void;
  selectedStyle: ArtStyle;
  label: string;
  imageSrc: string;
}

export function StyleSelectionButton({
  onClick,
  label,
  imageSrc,
}: StyleSelectionButtonProps) {
  const defaultImage = "/resources/placeholders/style_placeholder.png";
  const [currentImage, setCurrentImage] = useState(defaultImage);

  useEffect(() => {
    const img = new Image();
    img.onload = () => setCurrentImage(imageSrc);
    img.onerror = () => setCurrentImage(defaultImage);
    img.src = imageSrc;
  }, [imageSrc, defaultImage]);

  return (
    <div className="flex flex-col">
      <Label>Select a Style</Label>
      <button
        className="flex w-full cursor-pointer items-center justify-between gap-3 rounded-lg border border-[#363636] bg-brand-secondary p-2 pr-3 text-start transition-all hover:border-brand-primary hover:bg-brand-primary/20"
        onClick={onClick}
      >
        <div className="aspect-video w-20 overflow-hidden rounded-md bg-ui-controls-button/100">
          <img src={currentImage} alt={label} className="object-cover" />
        </div>
        <div className="grow">
          <>
            <H4>{label}</H4>
          </>
        </div>
        <FontAwesomeIcon icon={faChevronRight} className="text-xl opacity-60" />
      </button>
    </div>
  );
}
