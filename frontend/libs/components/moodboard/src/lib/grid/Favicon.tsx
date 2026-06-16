import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLink } from "@fortawesome/pro-regular-svg-icons";
import { faviconOf } from "../boards/linkMeta";

interface Props {
  url: string;
  className?: string;
}

// A site's own favicon with a graceful link-glyph fallback when it 404s or
// isn't an image. Reset on url change so a recycled card shows the right icon.
export const Favicon = ({ url, className = "h-4 w-4" }: Props) => {
  const src = faviconOf(url);
  const [failed, setFailed] = useState(false);

  useEffect(() => setFailed(false), [url]);

  if (!src || failed) {
    return (
      <FontAwesomeIcon icon={faLink} className={`${className} text-base-fg/45`} />
    );
  }
  return (
    <img
      src={src}
      alt=""
      width={16}
      height={16}
      draggable={false}
      onError={() => setFailed(true)}
      className={`${className} select-none rounded-sm object-contain`}
    />
  );
};
