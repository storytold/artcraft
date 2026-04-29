import { twMerge } from "tailwind-merge";
import { H4 } from "~/components";
import { ArtStyle } from "~/pages/PageScene/Editor/api_manager";

interface ItemPickerProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  label: string;
  type: ArtStyle;
  selected: boolean;
  onSelected: (picked: ArtStyle) => void;
}

export const ItemPicker = ({
  label,
  type,
  selected = false,
  onSelected,
  ...imgProps
}: ItemPickerProps) => {
  const handleSelected = () => {
    onSelected(type);
  };

  return (
    <button
      className={twMerge(
        "relative aspect-video cursor-pointer overflow-hidden rounded-lg border transition-colors ease-in-out",
        selected
          ? "border-brand-primary"
          : "border-[#363636] hover:border-brand-primary",
      )}
      onClick={handleSelected}
    >
      <img className="h-full w-full object-cover" {...imgProps} alt="Style" />
      <div className="absolute bottom-0 left-0 h-1/2 w-full bg-gradient-to-t from-black/80 to-transparent" />
      <H4 className="absolute bottom-[6px] left-[8px] w-60 truncate text-start text-sm font-medium drop-shadow-lg">
        {label}
      </H4>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 512 512"
        className={`absolute right-1.5 top-1.5 h-[22px] w-[22px] transition-opacity duration-200 ease-in-out ${
          selected ? "opacity-100" : "opacity-0"
        }`}
      >
        <path
          opacity="1"
          d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM369 209L241 337c-9.4 9.4-24.6 9.4-33.9 0l-64-64c-9.4-9.4-9.4-24.6 0-33.9s24.6-9.4 33.9 0l47 47L335 175c-9.4-9.4 24.6-9.4 33.9 0s9.4 24.6 0 33.9z"
          fill="#FC6B68"
        />
        <path
          d="M369 175c-9.4 9.4-9.4 24.6 0 33.9L241 337c-9.4 9.4-24.6 9.4-33.9 0l-64-64c-9.4-9.4-9.4-24.6 0-33.9s24.6-9.4 33.9 0l47 47L335 175c-9.4-9.4 24.6-9.4 33.9 0z"
          fill="#FFFFFF"
        />
      </svg>
    </button>
  );
};
