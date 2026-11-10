import { afterEach, describe, expect, it } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { getLanguage, languageFromTag, LANGUAGE_STORAGE_KEY, setLanguage, translate, useTranslation } from "./index";

afterEach(() => { cleanup(); setLanguage("en"); });

describe("Traditional Chinese interface", () => {
  it("respects explicit scripts and Taiwan, Hong Kong and Macau locales", () => {
    for (const tag of ["zh-TW", "zh_HK", "zh-MO", "zh-Hant-CN"]) expect(languageFromTag(tag)).toBe("zh-TW");
    for (const tag of ["en-US", "zh-CN", "zh-Hans-TW"]) expect(languageFromTag(tag)).toBe("en");
  });

  it("persists the selected language and preserves unknown labels", () => {
    setLanguage("zh-TW");
    expect(getLanguage()).toBe("zh-TW");
    expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe("zh-TW");
    expect(translate("zh-TW", "Settings")).toBe("設定");
    expect(translate("zh-TW", "constructor")).toBe("constructor");
    expect(translate("zh-TW", "My own scene title")).toBe("My own scene title");
  });

  it("switches visible labels without remounting or losing unsaved input", () => {
    function Editor() {
      const { t } = useTranslation();
      return <><label htmlFor="draft">{t("Home")}</label><input id="draft" defaultValue="" /><button>{t("Settings")}</button></>;
    }
    setLanguage("en");
    render(<Editor />);
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "我的未儲存創作" } });
    act(() => setLanguage("zh-TW"));
    expect(screen.getByRole("button").textContent).toBe("設定");
    expect(screen.getByRole("textbox")).toBe(input);
    expect((input as HTMLInputElement).value).toBe("我的未儲存創作");
    expect(document.documentElement.lang).toBe("zh-TW");
  });
});
