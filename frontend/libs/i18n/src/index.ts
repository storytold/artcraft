import { useEffect, useLayoutEffect, useSyncExternalStore } from "react";
import { getLanguage, subscribeLanguage, translate } from "./locale";
export * from "./locale";

const useDocumentLanguageEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

/** React subscriptions update visible chrome without remounting editors or changing user content. */
export function useTranslation() {
  const language = useSyncExternalStore(subscribeLanguage, getLanguage, () => "en" as const);
  useDocumentLanguageEffect(() => { document.documentElement.lang = language; }, [language]);
  return { language, t: (source: string | undefined) => translate(language, source ?? "") };
}
