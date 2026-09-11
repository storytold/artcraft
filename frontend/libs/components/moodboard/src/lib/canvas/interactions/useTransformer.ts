import { useEffect, useRef } from "react";
import Konva from "konva";
import { useMoodboardStore } from "../MoodboardStore";
import { MoodboardNode } from "../types";

interface NodePatch {
  id: string;
  patch: Partial<MoodboardNode>;
}

// Owns a single Konva.Transformer ref. Re-attaches its `nodes()` whenever
// the selection OR the root structure changes (e.g. group/ungroup
// reparented the previously-selected ids). On transformend, bakes
// scaleX/scaleY into width/height — and for groups, propagates the scale
// into each child's position/size so the resize sticks (Figma/Excalidraw
// behavior) instead of snapping back when the Group's scale resets to 1.
export const useTransformer = (stageRef: React.RefObject<Konva.Stage | null>) => {
  const transformerRef = useRef<Konva.Transformer | null>(null);
  const selectedIds = useMoodboardStore((s) => s.selectedIds);
  // rootOrder is included so a re-attach happens after group()/ungroup()
  // reparents Konva nodes — without it, findOne can return stale results.
  const rootOrder = useMoodboardStore((s) => s.rootOrder);
  const editingTextId = useMoodboardStore((s) => s.transient.editingTextId);

  useEffect(() => {
    const stage = stageRef.current;
    const transformer = transformerRef.current;
    if (!stage || !transformer) return;
    // Defer one frame so any pending Konva re-render commits before we
    // findOne — otherwise the new Group node may not exist yet.
    const raf = requestAnimationFrame(() => {
      const selectedNodes: Konva.Node[] = [];
      selectedIds.forEach((id) => {
        // Plain `#id` lookup — Konva's selector parser strips all spaces, so
        // a CSS.escape'd id (e.g. `\38 abc...` for a UUID starting with `8`)
        // ends up being compared as `\38abc...` and never matches. Our ids
        // are UUIDs (hex + dashes), which are already safe selectors.
        const found = stage.findOne(`#${id}`);
        if (found) selectedNodes.push(found);
      });
      transformer.nodes(selectedNodes);
      transformer.forceUpdate();
      transformer.getLayer()?.batchDraw();
    });
    return () => cancelAnimationFrame(raf);
  }, [selectedIds, rootOrder, stageRef]);

  useEffect(() => {
    const transformer = transformerRef.current;
    if (!transformer) return;

    const handleTransformEnd = () => {
      const store = useMoodboardStore.getState();
      store.pushHistory();

      const patches: NodePatch[] = [];

      transformer.nodes().forEach((node) => {
        const id = node.id();
        if (!id) return;
        const scaleX = node.scaleX();
        const scaleY = node.scaleY();
        const storeNode = store.nodes[id];
        if (!storeNode) return;

        // Groups: bake the scale into each child's position + size so the
        // resize survives the Group's own scale reset. Konva's <Group>
        // doesn't store width/height in a way that lets the children just
        // inherit the scale — we have to push it down explicitly.
        if (storeNode.kind === "group") {
          const uniformScale = (Math.abs(scaleX) + Math.abs(scaleY)) / 2;
          for (const childId of storeNode.childIds) {
            const child = store.nodes[childId];
            if (!child) continue;
            const childPatch: Partial<MoodboardNode> = {
              x: child.x * scaleX,
              y: child.y * scaleY,
              width: child.width * scaleX,
              height: child.height * scaleY,
            };
            // Text inside a scaled group needs fontSize to track the scale,
            // otherwise the text stays the same size and overflows / floats.
            if (child.kind === "text") {
              (childPatch as Partial<MoodboardNode> & { fontSize?: number })
                .fontSize = child.fontSize * uniformScale;
            }
            patches.push({ id: childId, patch: childPatch });
          }
        }

        // Bake the scale into the node's own width/height too, then reset
        // the Konva scale so subsequent transforms compose cleanly.
        const baseW = node.width() || 1;
        const baseH = node.height() || 1;
        const newWidth = baseW * scaleX;
        const newHeight = baseH * scaleY;
        node.scaleX(1);
        node.scaleY(1);
        node.width(newWidth);
        node.height(newHeight);

        patches.push({
          id,
          patch: {
            x: node.x(),
            y: node.y(),
            width: newWidth,
            height: newHeight,
            rotation: node.rotation(),
          },
        });
      });

      // Apply all patches in one store mutation so the tree only renders
      // once — keeps the visual transition from "scaled preview" to "baked
      // result" tight, with no flicker.
      if (patches.length === 0) return;
      useMoodboardStore.setState((s) => {
        const nodes = { ...s.nodes };
        for (const { id, patch } of patches) {
          const existing = nodes[id];
          if (!existing) continue;
          nodes[id] = { ...existing, ...patch } as MoodboardNode;
        }
        return { nodes };
      });

      // The Transformer caches its bbox from `getClientRect()` of the
      // attached node. For a Konva.Group, that walks children — but the
      // children haven't React-re-rendered to their new sizes yet, so a
      // sync forceUpdate would read the OLD bounds and the box would snap
      // back. Defer one frame so the children commit first.
      requestAnimationFrame(() => {
        transformer.forceUpdate();
        transformer.getLayer()?.batchDraw();
      });
    };
    transformer.on("transformend", handleTransformEnd);
    return () => {
      transformer.off("transformend", handleTransformEnd);
    };
  }, []);

  // Hide transformer entirely while editing a text node (avoid handle conflicts).
  useEffect(() => {
    const transformer = transformerRef.current;
    if (!transformer) return;
    transformer.visible(editingTextId === null);
    transformer.getLayer()?.batchDraw();
  }, [editingTextId]);

  return transformerRef;
};
