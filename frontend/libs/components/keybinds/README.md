# @storyteller/keybinds

Unified, customizable keyboard shortcuts for Artcraft. A single registry of
remappable actions, switchable **presets** (Gamer / Blender-like), per-user
overrides with conflict detection, and persistence — plus the UI primitives
(`<Kbd>`, key-capture input) used by the Settings pane and the cheatsheet.

The video editor keeps its own separate keybind system and is intentionally not
covered here (Settings links out to it).

## Concepts

- **Action** — a remappable operation (`registry.ts`), id-namespaced by surface
  (`pagescene.transform.translate`).
- **Binding** — `{ code, ctrl?, shift?, alt? }` keyed by physical `event.code`
  so WASD survives non-QWERTY layouts.
- **Preset** — a named set of 3D binding deltas over the Gamer base
  (`presets.ts`). 2D/moodboard are preset-independent.
- **Store** (`keybinds-store.ts`) — zustand + persist; resolves
  override → preset → base.

## Usage

```ts
import { useResolvedKeybinds } from "@storyteller/keybinds";

const { matchAction, forAction, slotBindings } = useResolvedKeybinds();
// in a keydown handler:
const action = matchAction(e, "pagescene");
if (action === "pagescene.transform.translate") setGizmoMode("translate");
```

Engine modules that aren't React can read `useKeybindsStore.getState().resolveBindings(id)`.
