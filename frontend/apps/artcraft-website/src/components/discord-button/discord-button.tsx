import { Button } from "@storyteller/ui-button";
import { DiscordIcon } from "@storyteller/icons";
import { SOCIAL_LINKS } from "../../config/links";

interface DiscordButtonProps {
  className?: string;
  small?: boolean;
}

export const DiscordButton = ({
  className = "",
  small = false,
}: DiscordButtonProps) => {
  const sizeClasses = small
    ? "px-4 py-2 text-sm"
    : "text-md px-4 py-2 md:px-6 md:py-3";

  return (
    <Button
      className={` relative z-10 ${sizeClasses} font-semibold transition-all duration-300 shadow-lg bg-white text-black hover:bg-gray-200 ${className}`}
      icon={DiscordIcon}
      as="link"
      href={SOCIAL_LINKS.DISCORD}
      target="_blank"
    >
      Join Discord
    </Button>
  );
};
