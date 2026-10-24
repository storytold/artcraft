import { describe, expect, it } from "vitest";
import { groupModelItems } from "./group-model-items";
import type { PopoverItem } from "./popover";

// Spec for the model picker's family grouping: a flat list of models becomes one row per family (Seedance, Veo, ...)
// with the models underneath, popular families first, "Other" last, newest version first inside a family.

const item = (label: string, selected = false): PopoverItem => ({ label, selected });
const familyOf = (it: PopoverItem) => it.label.split(" ")[0];

// Eight items, the smallest list that gets grouped.
const eight = (labels: string[]) => labels.map((label) => item(label));

describe("groupModelItems", () => {
  it("returns a short list unchanged", () => {
    const items = [item("Veo 3"), item("Kling 2")];
    expect(groupModelItems(items, familyOf)).toBe(items);
  });

  it("groups a list of eight or more into one row per family", () => {
    const grouped = groupModelItems(
      eight(["Veo 3", "Veo 2", "Kling 2", "Sora 2", "Grok 1", "Wan 2", "Vidu 1", "Seedance 1"]),
      familyOf,
    );
    expect(grouped.map((row) => row.label)).toEqual(["Seedance", "Veo", "Kling", "Sora", "Grok", "Vidu", "Wan"]);
    expect(grouped.find((row) => row.label === "Veo")?.subItems?.map((child) => child.label)).toEqual(["Veo 3", "Veo 2"]);
  });

  it("puts an unknown family after the curated ones in alphabetical order, and Other last", () => {
    const grouped = groupModelItems(
      eight(["Veo 1", "Zeta 1", "Alpha 1", "Mystery 1", "Mystery 2", "Kling 1", "Sora 1", "Grok 1"]),
      (it) => (it.label.startsWith("Mystery") ? undefined : familyOf(it)),
    );
    expect(grouped.map((row) => row.label)).toEqual(["Veo", "Kling", "Sora", "Grok", "Alpha", "Zeta", "Other"]);
  });

  it("sorts models newest first, comparing version numbers as numbers", () => {
    const grouped = groupModelItems(
      eight(["Veo 2", "Veo 10", "Veo 3.1", "Kling 1", "Sora 1", "Grok 1", "Wan 1", "Vidu 1"]),
      familyOf,
    );
    expect(grouped.find((row) => row.label === "Veo")?.subItems?.map((child) => child.label)).toEqual([
      "Veo 10",
      "Veo 3.1",
      "Veo 2",
    ]);
  });

  it("marks the family of the selected model and shows its name as the description", () => {
    const labels = ["Veo 3", "Veo 2", "Kling 2", "Sora 2", "Grok 1", "Wan 2", "Vidu 1", "Seedance 1"];
    const grouped = groupModelItems(
      labels.map((label) => item(label, label === "Veo 2")),
      familyOf,
    );
    const veo = grouped.find((row) => row.label === "Veo");
    expect(veo?.selected).toBe(true);
    expect(veo?.description).toBe("Veo 2");
    const kling = grouped.find((row) => row.label === "Kling");
    expect(kling?.selected).toBe(false);
    expect(kling?.description).toBeUndefined();
  });

  it("gives even a one-model family its own submenu", () => {
    const grouped = groupModelItems(
      eight(["Veo 3", "Veo 2", "Kling 2", "Sora 2", "Grok 1", "Wan 2", "Vidu 1", "Seedance 1"]),
      familyOf,
    );
    expect(grouped.find((row) => row.label === "Grok")?.subItems).toHaveLength(1);
  });

  it("takes the group icon from the first model after sorting", () => {
    const withIcon = (label: string, icon: string): PopoverItem => ({ label, selected: false, icon });
    const grouped = groupModelItems(
      [
        withIcon("Veo 2", "old"),
        withIcon("Veo 3", "new"),
        ...eight(["Kling 1", "Sora 1", "Grok 1", "Wan 1", "Vidu 1", "Seedance 1"]),
      ],
      familyOf,
    );
    expect(grouped.find((row) => row.label === "Veo")?.icon).toBe("new");
  });
});
