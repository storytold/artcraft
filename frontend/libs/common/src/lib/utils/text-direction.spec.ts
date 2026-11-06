import { isRightToLeft } from "./text-direction";

describe("isRightToLeft", () => {
  it.each(["ar", "ar-EG", "he", "he-IL", "fa-IR", "ur-PK", "ckb", "dv"])(
    "%s is written right to left",
    (tag) => {
      expect(isRightToLeft(tag)).toBe(true);
    },
  );

  it.each(["en-US", "de", "de-DE", "ja-JP", "zh-Hant-TW", "", "xx"])(
    "%s is written left to right",
    (tag) => {
      expect(isRightToLeft(tag)).toBe(false);
    },
  );

  it("lets a script subtag decide", () => {
    expect(isRightToLeft("pa-Arab-PK")).toBe(true);
    expect(isRightToLeft("az-Arab")).toBe(true);
    expect(isRightToLeft("ug-Cyrl")).toBe(false);
  });

  it("follows regions that use another script", () => {
    expect(isRightToLeft("pa-PK")).toBe(true);
    expect(isRightToLeft("pa-IN")).toBe(false);
    expect(isRightToLeft("sd-IN")).toBe(false);
    expect(isRightToLeft("ug-KZ")).toBe(false);
  });

  it("reads POSIX locale names", () => {
    expect(isRightToLeft("ar_EG.UTF-8")).toBe(true);
    expect(isRightToLeft("uz_AF@latin")).toBe(false);
  });
});
