import { cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { useMediaPromptTokens } from "./media-prompt-token-cache";

const { lookup } = vi.hoisted(() => ({ lookup: vi.fn(async () => ({ success: true, data: [] })) }));
vi.mock("@storyteller/api", () => ({ MediaFilesApi: class { ListMediaFilesByTokens = lookup; } }));
afterEach(() => { cleanup(); lookup.mockClear(); });

it("never sends local image identifiers to the cloud prompt lookup", async () => {
  const { result } = renderHook(() => useMediaPromptTokens(["local_file_saved", "m_cloud"]));
  await waitFor(() => expect(result.current.has("m_cloud")).toBe(true));
  expect(lookup).toHaveBeenCalledWith({ mediaTokens: ["m_cloud"] });
  expect(result.current.get("local_file_saved")).toBe("");
});
