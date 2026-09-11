export interface SelectionState {
  selectedIds: string[];
  anchorId: string | null;
}

export interface BoxSelectionSnapshot<TId = string> {
  initialSelectedIds: TId[];
  initialAnchorId: TId | null;
}

export interface SelectionBoxBounds {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface BoxSelectionChange<TId = string>
  extends BoxSelectionSnapshot<TId> {
  intersectedIds: TId[];
  isAdditive: boolean;
}

export type ResolveIntersections<TId = string> = ({
  startPos,
  currentPos,
}: {
  startPos: { x: number; y: number };
  currentPos: { x: number; y: number };
}) => TId[];

export interface SelectableSurfaceProps {
  orderedIds: string[];
  children: React.ReactNode;
  className?: string;
  ariaLabel?: string;
  revealId?: string | null;
  onRevealComplete?: () => void;
  onSelectionChange?: (state: SelectionState) => void;
}

export interface SelectableItemProps
  extends React.HTMLAttributes<HTMLDivElement> {
  id: string;
  children: React.ReactNode;
}
