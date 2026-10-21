import { afterEach, describe, expect, it, vi } from "vitest";
import type { EmbeddedCatalog } from "./embedded";

// The catalogs a build with CRAFT_I18N_DIR set would embed.
const { catalog } = vi.hoisted(() => ({
  catalog: (code: string, name: string, common: string, app: string): EmbeddedCatalog => ({
    code,
    name,
    load: () => Promise.resolve({ common, app }),
  }),
}));

vi.mock("./embedded", () => ({
  CRAFT_CATALOGS: [
    catalog("ar", "العربية", "\tSettings\tالإعدادات\n", "@plural\t{n} file|{n} files\t{n} صفر|{n} واحد|{n} اثنان|{n} قليل|{n} كثير|{n} آخر\n"),
    catalog("pt", "Português", "\tSettings\tDefinições\n\tHome\tInício\n", "\tSave\tGuardar\n"),
    catalog("pt-br", "Português (Brasil)", "\tSettings\tConfigurações\n", "menu\tOpen\tAbrir menu\n\tOpen\tAbrir\n"),
    catalog("zh-hans", "简体中文", "\tSave\t保存\n\tSettings\t不使用\n", "\tUpload\t上传\n"),
  ],
}));

const { i18n, LANGUAGES, setLocale, tn } = await import("./index");

afterEach(async () => {
  await setLocale("en");
});

describe("craft-i18n catalogs", () => {
  it("offers embedded locales by name, folding zh-hans into the bundled zh-CN", () => {
    expect(LANGUAGES.map((language) => [language.code, language.name])).toEqual([
      ["en", "English"],
      ["zh-CN", "简体中文"],
      ["ar", "العربية"],
      ["pt", "Português"],
      ["pt-BR", "Português (Brasil)"],
    ]);
  });

  it("sets lang and dir on the document for each language", async () => {
    await setLocale("ar");
    expect(document.documentElement.lang).toBe("ar");
    expect(document.documentElement.dir).toBe("rtl");
    await setLocale("en");
    expect(document.documentElement.dir).toBe("ltr");
  });

  it("looks up a region, then its language, then English", async () => {
    await setLocale("pt-BR");
    expect(i18n.t("Settings")).toBe("Configurações");
    expect(i18n.t("Home")).toBe("Início");
    expect(i18n.t("Save")).toBe("Guardar");
    expect(i18n.t("Not in any catalog")).toBe("Not in any catalog");
  });

  it("uses a context row, else the plain one", async () => {
    await setLocale("pt-BR");
    expect(i18n.t("Open", { context: "menu" })).toBe("Abrir menu");
    expect(i18n.t("Open", { context: "toolbar" })).toBe("Abrir");
  });

  it("picks the plural form by count, and English where there is none", async () => {
    const files = (n: number) => tn(i18n.t, n, "{{n}} file", "{{n}} files");
    expect(files(1)).toBe("1 file");
    expect(files(3)).toBe("3 files");
    await setLocale("ar");
    expect([0, 1, 2, 3, 11, 100].map(files)).toEqual(["0 صفر", "1 واحد", "2 اثنان", "3 قليل", "11 كثير", "100 آخر"]);
    await setLocale("pt");
    expect(files(1)).toBe("1 file");
    expect(files(0)).toBe("0 files");
  });

  it("fills a bundled language's gaps from its backing catalog", async () => {
    await setLocale("zh-CN");
    expect(i18n.t("Settings")).toBe("设置");
    expect(i18n.t("Upload")).toBe("上传");
  });
});
