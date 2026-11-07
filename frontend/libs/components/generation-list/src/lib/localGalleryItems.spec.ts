import { describe, expect, it } from "vitest";
import { mergeLocalGalleryItems } from "./localGalleryItems";

// The gallery modal's item shape: `fullImage` and `mediaClass` are optional there.
interface ModalItem {
  id: string;
  label: string;
  thumbnail: string | null;
  fullImage?: string | null;
  createdAt: string;
  mediaClass?: string;
}

describe("mergeLocalGalleryItems", () => {
  it("returns the remote list itself when there are no local items", () => {
    const remote = [modalItem("m_1", "2026-10-02")];
    expect(mergeLocalGalleryItems(remote, undefined)).toBe(remote);
    expect(mergeLocalGalleryItems(remote, [])).toBe(remote);
  });

  it("adds local items the remote list lacks, newest first", () => {
    const remote = [modalItem("m_1", "2026-10-03"), modalItem("m_2", "2026-10-01")];
    const local = [modalItem("local_file_a", "2026-10-02"), modalItem("m_1", "2026-10-04")];
    expect(mergeLocalGalleryItems(remote, local).map((item) => item.id)).toEqual(["m_1", "local_file_a", "m_2"]);
  });

  it("leaves out local items older than the loaded remote window while more pages remain", () => {
    const remote = [modalItem("m_1", "2026-10-05"), modalItem("m_2", "2026-10-03")];
    const local = [modalItem("local_new", "2026-10-04"), modalItem("local_edge", "2026-10-03"), modalItem("local_old", "2026-09-01")];
    expect(mergeLocalGalleryItems(remote, local, { remoteComplete: false }).map((item) => item.id))
      .toEqual(["m_1", "local_new", "m_2", "local_edge"]);
  });

  it("adds every local item once the remote list is exhausted", () => {
    const remote = [modalItem("m_1", "2026-10-05")];
    const local = [modalItem("local_old", "2026-09-01")];
    expect(mergeLocalGalleryItems(remote, local, { remoteComplete: true }).map((item) => item.id))
      .toEqual(["m_1", "local_old"]);
  });

  it("shows every local item when there are no remote items (signed out)", () => {
    const local = [modalItem("local_b", "2026-09-01"), modalItem("local_a", "2026-10-01")];
    expect(mergeLocalGalleryItems([], local, { remoteComplete: false }).map((item) => item.id))
      .toEqual(["local_a", "local_b"]);
  });
});

function modalItem(id: string, day: string): ModalItem {
  return { id, label: id, thumbnail: null, createdAt: `${day}T00:00:00Z` };
}
