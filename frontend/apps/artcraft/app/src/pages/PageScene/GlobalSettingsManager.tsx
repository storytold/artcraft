import { useSignals, useSignalEffect } from "@preact/signals-react/runtime";
import EnvironmentVariables from "~/Classes/EnvironmentVariables";
import { persistLogin } from "~/signals";
import { pageHeight, pageWidth } from "~/signals";
import { useEffect } from "react";



export const GlobalSettingsManager = ({ env }: { env: Record<string, string> }) => {
  useSignals();
  useSignalEffect(() => {
    persistLogin();
  });

  /// Initizations that depends on ENV vars ///
  function PostHogInit() {
    const data = EnvironmentVariables.values;
    const apiKey = data.REACT_APP_PUBLIC_POSTHOG_KEY as string;
    //posthog.init(apiKey, {
    //  //HACK: This is the default host from Netlify, but need to figure out why it isn't working on prod.
    //  // api_host: data.DEPLOY_PRIME_URL + "/ingest" as string,
    //  api_host: "https://studio.storyteller.ai/ingest" as string,
    //  ui_host: data.REACT_APP_PUBLIC_POSTHOG_UI as string,
    //});
  }
  useEffect(() => {
    EnvironmentVariables.initialize(env);
    PostHogInit();
  }, [env]);

  /// Initizations that run only once on 1ST mount ///
  function setPage() {
    // TODO address this issue with zooming
    pageHeight.value = window.innerHeight;
    pageWidth.value = window.innerWidth;
  }

  useEffect(() => {
    setPage();
    window.addEventListener("resize", setPage);
    return () => {
      window.removeEventListener("resize", setPage);
    };
  }, []);

  return null;
};
