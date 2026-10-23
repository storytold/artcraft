import { afterEach, describe, expect, it, vi } from "vitest";
import { directionOfLanguage, setDocumentLanguage } from "./document-language";

describe("directionOfLanguage", () => {
  it("finds right-to-left languages and scripts", () => {
    expect(directionOfLanguage("ar")).toBe("rtl");
    expect(directionOfLanguage("he-IL")).toBe("rtl");
    expect(directionOfLanguage("pa-Arab")).toBe("rtl");
    expect(directionOfLanguage("en")).toBe("ltr");
    expect(directionOfLanguage("az-Latn")).toBe("ltr");
    expect(directionOfLanguage("not a tag")).toBe("ltr");
  });

  describe("without Intl.Locale text info", () => {
    afterEach(() => vi.unstubAllGlobals());

    it("falls back to the language and script lists", () => {
      vi.stubGlobal("Intl", { ...Intl, Locale: class {} });
      expect(directionOfLanguage("ur-PK")).toBe("rtl");
      expect(directionOfLanguage("uz-Arab")).toBe("rtl");
      expect(directionOfLanguage("ks-Deva")).toBe("ltr");
      expect(directionOfLanguage("de")).toBe("ltr");
    });
  });
});

describe("setDocumentLanguage", () => {
  it("defaults to English, left to right", () => {
    setDocumentLanguage();
    expect(document.documentElement.lang).toBe("en");
    expect(document.documentElement.dir).toBe("ltr");
  });

  it("sets the direction from the language", () => {
    setDocumentLanguage("fa");
    expect(document.documentElement.lang).toBe("fa");
    expect(document.documentElement.dir).toBe("rtl");
  });
});
