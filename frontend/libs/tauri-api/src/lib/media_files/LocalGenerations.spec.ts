import { expect, it, vi } from "vitest";
import { invoke } from "@tauri-apps/api/core";
import { isLocalGeneration, ListLocalGenerations, ImportLocalGeneration } from "./LocalGenerations";

vi.mock("@tauri-apps/api/core", () => ({ invoke: vi.fn() }));

it("uploads a local image only through the authenticated backend command", async () => {
  vi.mocked(invoke).mockResolvedValueOnce({ status: "success", payload: { media_file_token: "mf_uploaded" } });
  expect(await ImportLocalGeneration("local_file_saved")).toBe("mf_uploaded");
  expect(invoke).toHaveBeenLastCalledWith("import_local_generation_command", { request: { id: "local_file_saved" } });
  vi.mocked(invoke).mockResolvedValueOnce({ status: "unauthorized", error_message: "Sign in first" });
  await expect(ImportLocalGeneration("local_file_saved")).rejects.toThrow("Sign in first");
});

it("reads the standard successful local image payload", async () => {
  const images = [{ id: "local_file_saved", url: "asset://localhost/image", prompt: "Sunset", model_id: "model", provider: "wavespeed", created_at: "2026-11-07T00:00:00Z" }];
  vi.mocked(invoke).mockResolvedValueOnce({ status: "success", payload: { images } });
  expect(await ListLocalGenerations()).toEqual(images);
  expect(invoke).toHaveBeenCalledWith("list_local_generations_command");
});

it("ignores payloads from failed commands", async () => {
  vi.mocked(invoke).mockResolvedValueOnce({ status: "unauthorized", payload: { images: [{}] } });
  expect(await ListLocalGenerations()).toEqual([]);
});

it("loads bounded pages without dropping older local generations", async () => {
  vi.mocked(invoke).mockResolvedValueOnce({ status: "success", payload: { images: [{ id: "local_file_first" }], next_cursor: 50 } });
  vi.mocked(invoke).mockResolvedValueOnce({ status: "success", payload: { images: [{ id: "local_file_last" }], next_cursor: null } });
  expect((await ListLocalGenerations()).map((image) => image.id)).toEqual(["local_file_first", "local_file_last"]);
  expect(invoke).toHaveBeenLastCalledWith("list_local_generations_command", { request: { cursor: 50 } });
});

it.each([
  "local_file_3f2a9c1e_4b7d_4e8a_9c2f_1a2b3c4d5e6f",
  "local_file_abc123",
  "local_file_A",
  "local_file__",
  "local_file_",
  "local_file_abc-123",
  "local_file_abc/../x",
  "local_file_abc def",
  "local_file_é",
])("treats %s as a local generation", (id) => {
  expect(isLocalGeneration(id)).toBe(true);
});

it.each([
  "",
  "LOCAL_FILE_abc",
  "m_abc123",
  " local_file_abc",
  "xlocal_file_abc",
])("treats %j as a library media token", (id) => {
  expect(isLocalGeneration(id)).toBe(false);
});
