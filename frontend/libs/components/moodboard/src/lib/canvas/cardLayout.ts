import { CardNode, MoodboardNode } from "./types";

export const DEFAULT_CARD_WIDTH = 280;
export const DEFAULT_CARD_PADDING = 8;
export const DEFAULT_CARD_COLOR = "#FFFFFF";

// Height of one child when laid out inside a card: child's native aspect
// ratio applied to (cardWidth - 2*padding), falling back to the child's own
// height when aspect isn't available (text nodes, nested containers).
export const childRenderedHeight = (
  child: MoodboardNode,
  innerWidth: number,
): number => {
  if (child.kind === "image" || child.kind === "video") {
    const ratio =
      child.naturalH > 0 && child.naturalW > 0
        ? child.naturalH / child.naturalW
        : child.height / Math.max(child.width, 1);
    return innerWidth * ratio;
  }
  if (child.kind === "text") return child.height;
  return child.height;
};

export const computeCardHeight = (
  card: CardNode,
  nodes: Record<string, MoodboardNode>,
): number => {
  const innerW = Math.max(card.width - card.padding * 2, 1);
  let total = card.padding;
  for (const cid of card.childIds) {
    const c = nodes[cid];
    if (!c) continue;
    total += childRenderedHeight(c, innerW) + card.padding;
  }
  return Math.max(total, card.padding * 2);
};
