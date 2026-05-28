"use client";

import type {
  PreviewOverlayHudAnchor,
  PreviewOverlayInstance,
  PreviewOverlayPlane,
} from "../overlays";
import { usePreviewViewport } from "./preview-viewport";

const HUD_ANCHOR_CLASS_NAMES: Record<PreviewOverlayHudAnchor, string> = {
  "top-left": "absolute top-2 left-2 flex flex-col items-start gap-1.5",
  "top-right": "absolute top-2 right-2 flex flex-col items-end gap-1.5",
  "bottom-left":
    "absolute bottom-2 left-2 flex flex-col-reverse items-start gap-1.5",
  "bottom-right":
    "absolute right-2 bottom-2 flex flex-col-reverse items-end gap-1.5",
};

function getPositionedMountStyle({
  instance,
  baseStyle,
  sceneLeft,
  sceneTop,
  sceneWidth,
  sceneHeight,
}: {
  instance: PreviewOverlayInstance;
  baseStyle: {
    pointerEvents: "none" | "auto";
    zIndex: number | undefined;
  };
  sceneLeft: number;
  sceneTop: number;
  sceneWidth: number;
  sceneHeight: number;
}) {
  if (instance.mount.kind === "hud") {
    return baseStyle;
  }

  const isSceneMount = instance.mount.kind === "scene";
  const mount = instance.mount;
  const hasExplicitBounds =
    mount.x != null ||
    mount.y != null ||
    mount.width != null ||
    mount.height != null;

  return {
    ...baseStyle,
    left: (isSceneMount ? sceneLeft : 0) + (mount.x ?? 0),
    top: (isSceneMount ? sceneTop : 0) + (mount.y ?? 0),
    ...(hasExplicitBounds
      ? {
          ...(mount.width != null ? { width: mount.width } : {}),
          ...(mount.height != null ? { height: mount.height } : {}),
        }
      : {
          width: isSceneMount ? sceneWidth : "100%",
          height: isSceneMount ? sceneHeight : "100%",
        }),
  } as const;
}

export function PreviewOverlayLayer({
  instances,
  plane,
}: {
  instances: PreviewOverlayInstance[];
  plane: PreviewOverlayPlane;
}) {
  const viewport = usePreviewViewport();
  const visibleInstances = instances
    .filter((instance) => (instance.plane ?? "over-interaction") === plane)
    .sort((left, right) => (left.zIndex ?? 0) - (right.zIndex ?? 0));

  if (visibleInstances.length === 0) {
    return null;
  }

  const hudInstancesByAnchor = visibleInstances.reduce<
    Record<PreviewOverlayHudAnchor, PreviewOverlayInstance[]>
  >(
    (groups, instance) => {
      if (instance.mount.kind === "hud") {
        groups[instance.mount.anchor].push(instance);
      }
      return groups;
    },
    {
      "top-left": [],
      "top-right": [],
      "bottom-left": [],
      "bottom-right": [],
    },
  );

  return (
    <>
      {visibleInstances.map((instance) => {
        if (instance.mount.kind === "hud") {
          return null;
        }

        const pointerEvents = instance.pointerEvents ?? "none";
        const baseStyle = {
          pointerEvents,
          zIndex: instance.zIndex,
        } as const;
        const content = instance.render({
          sceneHeight: viewport.sceneHeight,
          sceneWidth: viewport.sceneWidth,
        });

        switch (instance.mount.kind) {
          case "scene":
            return (
              <div
                key={instance.id}
                className="absolute"
                style={getPositionedMountStyle({
                  instance,
                  baseStyle,
                  sceneLeft: viewport.sceneLeft,
                  sceneTop: viewport.sceneTop,
                  sceneWidth: viewport.sceneWidth,
                  sceneHeight: viewport.sceneHeight,
                })}
              >
                {content}
              </div>
            );

          case "viewport":
            return (
              <div
                key={instance.id}
                className="absolute"
                style={getPositionedMountStyle({
                  instance,
                  baseStyle,
                  sceneLeft: viewport.sceneLeft,
                  sceneTop: viewport.sceneTop,
                  sceneWidth: viewport.sceneWidth,
                  sceneHeight: viewport.sceneHeight,
                })}
              >
                {content}
              </div>
            );

          default:
            return null;
        }
      })}
      {(
        Object.entries(hudInstancesByAnchor) as Array<
          [PreviewOverlayHudAnchor, PreviewOverlayInstance[]]
        >
      ).map(([anchor, anchorInstances]) => {
        if (anchorInstances.length === 0) {
          return null;
        }

        const sortedAnchorInstances = [...anchorInstances].sort(
          (left, right) =>
            (left.mount.kind === "hud" ? (left.mount.order ?? 0) : 0) -
            (right.mount.kind === "hud" ? (right.mount.order ?? 0) : 0),
        );

        return (
          <div key={anchor} className={HUD_ANCHOR_CLASS_NAMES[anchor]}>
            {sortedAnchorInstances.map((instance) => {
              const pointerEvents = instance.pointerEvents ?? "none";
              const content = instance.render({
                sceneHeight: viewport.sceneHeight,
                sceneWidth: viewport.sceneWidth,
              });

              return (
                <div
                  key={instance.id}
                  style={{
                    pointerEvents,
                    zIndex: instance.zIndex,
                  }}
                >
                  {content}
                </div>
              );
            })}
          </div>
        );
      })}
    </>
  );
}
