import { describe, expect, it } from "vitest";
import { catalogResources, parseCatalog, pluralCategories } from "./craft-catalog";

const HEADER = "# French (fr) interface catalog for ArtCraft.\n#   context  usually empty.\n";

describe("parseCatalog", () => {
  it("reads rows, unescapes columns and skips comments, blank lines, BOM and CRLF", () => {
    const text = `\uFEFF${HEADER}\r\n\tSave\tEnregistrer\r\nmenu\tOpen\tOuvrir le menu\n\tLine\\none\tLigne\\nune\n`;
    const { rows, problems } = parseCatalog(text, 2);
    expect(problems).toEqual([]);
    expect(rows).toEqual([
      { context: "", source: "Save", translation: "Enregistrer" },
      { context: "menu", source: "Open", translation: "Ouvrir le menu" },
      { context: "", source: "Line\none", translation: "Ligne\nune" },
    ]);
  });

  it("skips and reports each broken row, keeping the first of a duplicate", () => {
    const text = [
      "\tSave\tEnregistrer",
      "\tSave\tSauvegarder",
      "\tOnly two",
      "\tOpen {name}\tOuvrir",
      "\tExport…\tExporter",
      "\tBad\\x\tMauvais",
      "@nope\tA\tB",
      "\tEmpty\t",
      "@plural\t{n} page\t{n} page|{n} pages",
      "@plural\t{n} page|{n} pages\t{n} page",
    ].join("\n");
    const { rows, problems } = parseCatalog(text, 2);
    expect(rows.map((row) => row.translation)).toEqual(["Enregistrer"]);
    expect(problems).toEqual([
      "line 2: defined twice (same context and source text); the first is kept",
      "line 3: 2 columns; expected 3",
      "line 4: placeholders differ from the source text",
      "line 5: trailing … differs from the source text",
      "line 6: unknown escape \\x",
      'line 7: unknown reserved context "@nope"',
      "line 8: empty source text or translation",
      "line 9: plural source text must be one|other",
      "line 10: expected 2 nonempty plural forms",
    ]);
  });
});

describe("pluralCategories", () => {
  it("lists the categories whole numbers reach, in CLDR order", () => {
    expect(pluralCategories("ja")).toEqual(["other"]);
    expect(pluralCategories("fr")).toEqual(["one", "other"]);
    expect(pluralCategories("ru")).toEqual(["one", "few", "many"]);
    expect(pluralCategories("ar")).toEqual(["zero", "one", "two", "few", "many", "other"]);
    // European Portuguese: 0 is plural.
    expect(pluralCategories("pt")).toEqual(["one", "other"]);
  });
});

describe("catalogResources", () => {
  it("keys rows by English with i18next placeholders and contexts, app rows winning", () => {
    const common = "\tSave\tEnregistrer\n\tOpen {name}\tOuvrir {name}\nmenu\tOpen\tOuvrir le menu\n";
    const app = "\tSave\tSauvegarder\n";
    const { resources, problems } = catalogResources("fr", common, app);
    expect(problems).toEqual([]);
    expect(resources["Save"]).toBe("Sauvegarder");
    expect(resources["Open {{name}}"]).toBe("Ouvrir {{name}}");
    expect(resources["Open_menu"]).toBe("Ouvrir le menu");
  });

  it("spreads @plural forms over the locale's plural suffixes", () => {
    const ru = catalogResources("ru", "@plural\t{n} file|{n} files\t{n} файл|{n} файла|{n} файлов\n", "");
    expect(ru.resources).toMatchObject({
      "{{n}} file|{{n}} files_one": "{{n}} файл",
      "{{n}} file|{{n}} files_few": "{{n}} файла",
      "{{n}} file|{{n}} files_many": "{{n}} файлов",
      // Fractions only; takes the last form.
      "{{n}} file|{{n}} files_other": "{{n}} файлов",
    });
    expect(ru.resources).not.toHaveProperty("{{n}} file|{{n}} files_zero");
    const fr = catalogResources("fr", "@plural\t{n} file|{n} files\t{n} fichier|{n} fichiers\n", "");
    // French `many` (a million) is not among the forms either.
    expect(fr.resources["{{n}} file|{{n}} files_many"]).toBe("{{n}} fichiers");
  });

  it("prefixes problems with the catalog they come from", () => {
    expect(catalogResources("fr", "", "\tA\n").problems).toEqual(["app: line 1: 2 columns; expected 3"]);
  });
});
