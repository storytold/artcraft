function isIntersecting({
  selectionRect,
  itemRect,
}: {
  selectionRect: DOMRect;
  itemRect: DOMRect;
}) {
  return !(
    itemRect.right < selectionRect.left ||
    itemRect.left > selectionRect.right ||
    itemRect.bottom < selectionRect.top ||
    itemRect.top > selectionRect.bottom
  );
}

function createSelectionRect({
  startPos,
  currentPos,
}: {
  startPos: { x: number; y: number };
  currentPos: { x: number; y: number };
}) {
  return new DOMRect(
    Math.min(startPos.x, currentPos.x),
    Math.min(startPos.y, currentPos.y),
    Math.abs(currentPos.x - startPos.x),
    Math.abs(currentPos.y - startPos.y),
  );
}

export function resolveElementIntersections({
  startPos,
  currentPos,
  elements,
}: {
  startPos: { x: number; y: number };
  currentPos: { x: number; y: number };
  elements: Map<string, HTMLElement>;
}) {
  const selectionRect = createSelectionRect({ startPos, currentPos });

  return [...elements.entries()]
    .filter(([, element]) =>
      isIntersecting({
        selectionRect,
        itemRect: element.getBoundingClientRect(),
      }),
    )
    .map(([id]) => id);
}
