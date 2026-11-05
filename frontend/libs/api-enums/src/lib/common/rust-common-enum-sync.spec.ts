import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { GenerationProvider } from "./generation_provider";
import { CommonAspectRatio } from "./generation/CommonAspectRatio";
import { CommonImageModel } from "./generation/CommonImageModel";
import { CommonQuality } from "./generation/CommonQuality";
import { CommonVideoModel } from "./generation/CommonVideoModel";
import { CommonVideoResolution } from "./generation/CommonVideoResolution";

// Rust is the source of truth for these enums and the frontend keeps a copy (see the note at the top of each file).
// This guard fails when a value is added or renamed on one side only, like rust-enum-sync.spec.ts does for the
// task enums.
const RUST_COMMON_DIR = resolve(__dirname, "../../../../../../crates/schema/public/enums/src/common");

// Some of these enums list their wire values in a `to_str` table (`Self::X => "value"`); others put a
// `#[serde(rename = "value")]` on each variant. Read both. A variant with no rename gets serde's snake_case name.
function rustValues(relativePath: string): string[] {
  const source = readFileSync(resolve(RUST_COMMON_DIR, relativePath), "utf8");
  const fromTable = [...source.matchAll(/Self::\w+\s*=>\s*"([^"]+)"/g)].map((match) => match[1]);
  if (fromTable.length > 0) return fromTable;
  return serdeVariantNames(source);
}

function serdeVariantNames(source: string): string[] {
  const start = source.search(/pub enum \w+\s*\{/);
  const body = source.slice(source.indexOf("{", start) + 1, source.indexOf("\n}", start));
  const names: string[] = [];
  let pendingRename: string | null = null;
  for (const line of body.split("\n")) {
    const text = line.trim();
    const rename = text.match(/^#\[serde\(rename\s*=\s*"([^"]+)"\)\]$/);
    if (rename) {
      pendingRename = rename[1];
      continue;
    }
    if (text === "" || text.startsWith("#[") || text.startsWith("//")) continue;
    const variant = text.match(/^([A-Z]\w*)/);
    if (!variant) continue;
    names.push(pendingRename ?? variant[1].replace(/(?<!^)([A-Z])/g, "_$1").toLowerCase());
    pendingRename = null;
  }
  return names;
}

const CASES: Array<[string, string, Record<string, string>]> = [
  ["GenerationProvider", "generation_provider.rs", GenerationProvider],
  ["CommonAspectRatio", "generation/common_aspect_ratio.rs", CommonAspectRatio],
  ["CommonImageModel", "generation/common_image_model.rs", CommonImageModel],
  ["CommonVideoModel", "generation/common_video_model.rs", CommonVideoModel],
  ["CommonQuality", "generation/common_quality.rs", CommonQuality],
  ["CommonVideoResolution", "generation/common_resolution.rs", CommonVideoResolution],
];

describe("frontend common enums match the Rust enums", () => {
  it.each(CASES)("%s has exactly the values of %s", (_name, file, tsEnum) => {
    expect([...Object.values(tsEnum)].sort()).toEqual([...new Set(rustValues(file))].sort());
  });
});
