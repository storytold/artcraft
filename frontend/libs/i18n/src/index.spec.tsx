import React from "react";
import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import en from "./locales/en.json";
import zhCN from "./locales/zh-CN.json";
import { i18n, isLocale, LOCALE_STORAGE_KEY, readLocale, setLocale, Trans, useTranslation } from "./index";

const tokens = (message: string) => [...message.matchAll(/\{\{\s*([^}]+?)\s*\}\}/g)].map((match) => match[1]).sort();

afterEach(async () => {
  cleanup();
  vi.restoreAllMocks();
  await setLocale("en");
  localStorage.clear();
});

describe("language resources", () => {
  it("keeps keys, interpolation tokens and rich-text tags in sync", () => {
    expect(Object.keys(zhCN).sort()).toEqual(Object.keys(en).sort());
    for (const key of Object.keys(en) as (keyof typeof en)[]) {
      expect(zhCN[key].trim(), key).not.toBe("");
      expect(tokens(zhCN[key]), key).toEqual(tokens(en[key]));
      expect(zhCN[key].match(/<\/?[a-z]+>/g) ?? [], key).toEqual(en[key].match(/<\/?[a-z]+>/g) ?? []);
    }
  });
  it("falls back to English when the Chinese entry is missing", async () => {
    i18n.addResource("en", "translation", "fallbackProbe", "English fallback");
    try {
      await setLocale("zh-CN");
      expect(i18n.t("fallbackProbe")).toBe("English fallback");
      expect(i18n.t("Untranslated source message.")).toBe("Untranslated source message.");
    } finally {
      delete i18n.getResourceBundle("en", "translation").fallbackProbe;
    }
  });
  it("handles punctuation and credit plurals", async () => {
    expect(i18n.t("creditCost", { count: 1 })).toBe("1 credit cost");
    expect(i18n.t("creditCost", { count: 2 })).toBe("2 credits cost");
    await setLocale("zh-CN");
    expect(i18n.t("Choose your preferred look. Applies instantly.")).toBe("选择喜欢的外观，立即生效。");
    expect(i18n.t("creditCost", { count: 0 })).toBe("消耗 0 积分");
    expect(i18n.t("creditCost", { count: 2 })).toBe("消耗 2 积分");
  });
});

describe("locale preference", () => {
  it("defaults to English and rejects unknown stored values", () => {
    localStorage.clear();
    expect(readLocale()).toBe("en");
    localStorage.setItem(LOCALE_STORAGE_KEY, "unknown");
    expect(readLocale()).toBe("en");
    expect(isLocale("zh-CN")).toBe(true);
    expect(isLocale("zh-TW")).toBe(false);
  });
  it("persists explicit choices and updates the document language", async () => {
    await setLocale("zh-CN");
    expect(readLocale()).toBe("zh-CN");
    expect(document.documentElement.lang).toBe("zh-CN");
    await setLocale("en");
    expect(readLocale()).toBe("en");
    expect(document.documentElement.lang).toBe("en");
  });
  it("still switches when storage is unavailable", async () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new Error("blocked"); });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("blocked"); });
    expect(readLocale()).toBe("en");
    await expect(setLocale("zh-CN")).resolves.toBeUndefined();
    expect(i18n.t("Settings")).toBe("设置");
  });
});

describe("React integration", () => {
  it("updates mounted text without resetting input or interpreting interpolation as HTML", async () => {
    function Example() {
      const { t } = useTranslation();
      return <React.Fragment>
        <h1>{t("Settings")}</h1>
        <p><Trans t={t} i18nKey="What will you <craft>craft</craft> today?" components={{ craft: <strong /> }} /></p>
        <input aria-label="user prompt" defaultValue="My original 中文 prompt" />
        <p>{t("Subscription ends on {{date}}", { date: "<img src=x>" })}</p>
      </React.Fragment>;
    }
    const { container } = render(<Example />);
    expect(screen.getByRole("heading").textContent).toBe("Settings");
    await act(() => setLocale("zh-CN"));
    expect(screen.getByRole("heading").textContent).toBe("设置");
    expect(container.querySelector("strong")?.textContent).toBe("创作");
    expect((screen.getByLabelText("user prompt") as HTMLInputElement).value).toBe("My original 中文 prompt");
    expect(container.querySelector("img")).toBeNull();
    expect(container.textContent).toContain("<img src=x>");
    await act(() => setLocale("en"));
    expect(screen.getByRole("heading").textContent).toBe("Settings");
  });
});
