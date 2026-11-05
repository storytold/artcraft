import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { TaskMediaFileClass } from "./task_media_file_class";
import { TaskModelType } from "./task_model_type";
import { TaskStatus } from "./task_status";
import { TaskType } from "./task_type";

// Rust is the source of truth for these enums and the frontend keeps a copy. This guard fails when a value is
// added or renamed on one side only.
const RUST_DIR = resolve(__dirname, "../../../../../../../crates/schema/public/enums/src/tauri/tasks");

function rustValues(file: string): string[] {
  const source = readFileSync(resolve(RUST_DIR, file), "utf8");
  return [...source.matchAll(/Self::\w+\s*=>\s*"([^"]+)"/g)].map((match) => match[1]);
}

const CASES: Array<[string, string, Record<string, string>]> = [
  ["TaskModelType", "task_model_type.rs", TaskModelType],
  ["TaskStatus", "task_status.rs", TaskStatus],
  ["TaskType", "task_type.rs", TaskType],
  ["TaskMediaFileClass", "task_media_file_class.rs", TaskMediaFileClass],
];

describe("frontend task enums match the Rust enums", () => {
  it.each(CASES)("%s has exactly the values of %s", (_name, file, tsEnum) => {
    expect([...Object.values(tsEnum)].sort()).toEqual([...new Set(rustValues(file))].sort());
  });
});
