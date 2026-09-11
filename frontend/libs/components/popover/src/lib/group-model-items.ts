import { FAMILY_ORDER } from "@storyteller/model-list";
import { PopoverItem } from "./popover";

// Below this many models a grouped picker is pure friction — show the flat
// list. Keeps short pickers (3D pages, static lists) flat with no per-callsite
// opt-outs.
const MIN_ITEMS_TO_GROUP = 8;

const OTHER_FAMILY = "Other";

/**
 * Fold a flat model-picker list into family group rows ("Seedance", "Veo", …)
 * whose `subItems` hold that family's models. Every family gets a submenu —
 * even single-model ones — so the top level reads uniformly. Lists shorter
 * than {@link MIN_ITEMS_TO_GROUP} are returned unchanged.
 *
 * Group rows carry `selected` when they contain the selected model (so the
 * existing highlight + scroll-into-view logic applies) and surface the
 * selected model's name as their description line.
 */
export function groupModelItems(
  items: PopoverItem[],
  getFamily: (item: PopoverItem) => string | undefined,
): PopoverItem[] {
  if (items.length < MIN_ITEMS_TO_GROUP) return items;

  const families = new Map<string, PopoverItem[]>();
  for (const item of items) {
    const family = getFamily(item) ?? OTHER_FAMILY;
    const bucket = families.get(family);
    if (bucket) {
      bucket.push(item);
    } else {
      families.set(family, [item]);
    }
  }

  const orderedFamilies = [...families.keys()].sort(compareFamilies);

  return orderedFamilies.map((family) => {
    const children = families
      .get(family)!
      .slice()
      .sort(compareModelLabelsNewestFirst);
    const selectedChild = children.find((child) => child.selected);
    return {
      label: family,
      selected: selectedChild !== undefined,
      icon: children[0].icon,
      description: selectedChild?.label,
      subItems: children,
    };
  });
}

// Curated popular-first order, then alphabetical, "Other" always last.
function compareFamilies(a: string, b: string): number {
  if (a === OTHER_FAMILY) return 1;
  if (b === OTHER_FAMILY) return -1;
  const aOrder = FAMILY_ORDER.indexOf(a);
  const bOrder = FAMILY_ORDER.indexOf(b);
  if (aOrder !== -1 && bOrder !== -1) return aOrder - bOrder;
  if (aOrder !== -1) return -1;
  if (bOrder !== -1) return 1;
  return a.localeCompare(b);
}

// Numeric-aware descending label sort so newest versions surface first
// ("Seedance 2.0" above "Seedance 1.5 Pro").
function compareModelLabelsNewestFirst(a: PopoverItem, b: PopoverItem): number {
  return b.label.localeCompare(a.label, undefined, { numeric: true });
}
