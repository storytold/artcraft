import { expect, it } from "vitest";
import { isLocalGeneration } from "./LocalGenerations";

it.each([
  "local_file_3f2a9c1e_4b7d_4e8a_9c2f_1a2b3c4d5e6f",
  "local_file_abc123",
  "local_file_A",
  "local_file__",
])("treats %s as a local generation", (id) => {
  expect(isLocalGeneration(id)).toBe(true);
});

it.each([
  "",
  "local_file_",
  "local_file_abc-123",
  "local_file_abc/../x",
  "local_file_abc def",
  "local_file_é",
  "LOCAL_FILE_abc",
  "m_abc123",
  " local_file_abc",
  "xlocal_file_abc",
])("treats %j as a library media token", (id) => {
  expect(isLocalGeneration(id)).toBe(false);
});
