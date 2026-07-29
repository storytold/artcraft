import { useEffect } from "react";

const SITE_TITLE = "ArtCraft Admin Dashboard";

export function usePageTitle(title?: string) {
  useEffect(() => {
    document.title = title ? `${title} - ${SITE_TITLE}` : SITE_TITLE;
    return () => {
      document.title = SITE_TITLE;
    };
  }, [title]);
}
