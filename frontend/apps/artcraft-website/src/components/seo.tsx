import { useEffect } from "react";

type SeoProps = {
  title: string;
  description?: string;
  jsonLd?: object | object[];
};

const Seo = ({ title, description, jsonLd }: SeoProps) => {
  useEffect(() => {
    document.title = title;

    if (description) {
      let meta = document.querySelector(
        'meta[name="description"]'
      ) as HTMLMetaElement | null;
      if (!meta) {
        meta = document.createElement("meta");
        meta.setAttribute("name", "description");
        document.head.appendChild(meta);
      }
      meta.setAttribute("content", description);
    }

    let script: HTMLScriptElement | null = null;
    if (jsonLd) {
      script = document.createElement("script");
      script.type = "application/ld+json";
      script.text = JSON.stringify(jsonLd);
      document.head.appendChild(script);
    }

    return () => {
      if (script && script.parentNode) script.parentNode.removeChild(script);
    };
  }, [title, description, jsonLd]);

  return null;
};

export default Seo;
