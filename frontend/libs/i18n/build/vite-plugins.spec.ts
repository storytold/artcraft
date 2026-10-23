// @vitest-environment node
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import * as path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { embeddedModule, findFaces, findLocales, fontFaceCss } from "./vite-plugins";

const dirs: string[] = [];
afterEach(() => dirs.splice(0).forEach((dir) => rmSync(dir, { recursive: true, force: true })));

function checkout(files: Record<string, string | Buffer>): string {
  const dir = mkdtempSync(path.join(tmpdir(), "craft-checkout-"));
  dirs.push(dir);
  for (const [file, content] of Object.entries(files)) {
    mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
    writeFileSync(path.join(dir, file), content);
  }
  return dir;
}

/** The smallest OpenType header with one table directory entry. */
function font(table: string): Buffer {
  const data = Buffer.alloc(28);
  data.writeUInt16BE(1, 4);
  data.write(table, 12, "latin1");
  return data;
}

describe("craftI18n", () => {
  it("embeds only locales with ArtCraft's own catalog, named by language.name", () => {
    const dir = checkout({
      "locales/fr/common.tsv": "# header\n@id\tlanguage.name\tFrançais\n\tSave\tEnregistrer\n",
      "locales/fr/artcraft.tsv": "\tUpload\tTéléverser\n",
      "locales/de/common.tsv": "\tSave\tSpeichern\n",
      "locales/ka/artcraft.tsv": "\tSave\tშენახვა\n",
    });
    const locales = findLocales(dir, false, () => {});
    expect(locales.map((l) => [l.code, l.name])).toEqual([["fr", "Français"], ["ka", "ka"]]);
    expect(embeddedModule(locales)).toContain('code: "fr", name: "Français", load: () => import("virtual:craft-i18n/fr")');
  });

  it("warns and builds in English without a checkout, unless required", () => {
    const warnings: string[] = [];
    const dir = checkout({ "README.md": "" });
    expect(findLocales(dir, false, (message) => warnings.push(message))).toEqual([]);
    expect(warnings).toHaveLength(1);
    expect(() => findLocales(dir, true, () => {})).toThrow("no locales/ directory");
  });
});

describe("craftFonts", () => {
  it("declares the Noto faces with their scripts' unicode ranges", () => {
    const dir = checkout({
      "fonts/manifest.txt": [
        "# family | style | file | scripts | licence | licence file | sha256 | source",
        "Noto Sans Thai | Regular | fonts/thai/NotoSansThai.ttf | Thai | OFL-1.1 | fonts/thai/OFL.txt | 0 | x",
        "Noto Sans CJK SC | Regular | fonts/cjk/NotoSansCJKsc-Regular.otf | Hans,Latn | OFL-1.1 | fonts/cjk/OFL.txt | 0 | x",
        "BIZ UDPGothic | Regular | fonts/biz/BIZUDPGothic-Regular.ttf | Jpan,Latn | OFL-1.1 | fonts/biz/OFL.txt | 0 | x",
      ].join("\n"),
      "fonts/thai/NotoSansThai.ttf": font("fvar"),
      "fonts/cjk/NotoSansCJKsc-Regular.otf": font("CFF "),
      "fonts/biz/BIZUDPGothic-Regular.ttf": font("glyf"),
    });
    const faces = findFaces(dir, false, () => {});
    expect(faces.map((face) => face.family)).toEqual(["Noto Sans Thai", "Noto Sans CJK SC"]);
    const css = fontFaceCss(faces, "/");
    expect(css).toContain('font-family: "Noto Sans Thai"; font-weight: 100 900;');
    expect(css).toContain('url("/craft-fonts/NotoSansThai.ttf"); unicode-range: U+0E00-0E7F;');
    expect(css).toContain('font-family: "Noto Sans CJK SC"; font-weight: 400;');
    expect(css).toContain(':root { --craft-fonts: "Noto Sans Thai", "Noto Sans CJK SC", sans-serif; }');
  });
});
