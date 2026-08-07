// Drives skeletal (Mixamo) animation clips placed on the timeline as clip
// lanes. Each character gets one THREE.AnimationMixer; each clip lane becomes
// an AnimationAction on that mixer. Playback is DETERMINISTIC and playhead-
// driven: we never let the mixer advance on its own — on every timeline
// evaluate() we set each action's absolute time from the playhead and call
// mixer.update(0). This makes scrubbing, play, and frame-accurate recording all
// pose the character identically.
//
// Clips are authored on their own (source) armature. We bind them onto the
// character by node name: Mixamo rigs share the "mixamorig:*" bone naming, so a
// clip's tracks resolve directly against the character's bones. If a character
// uses a differently-named rig, retargeting (SkeletonUtils.retargetClip) is the
// fallback — see retargetOntoCharacter() (not wired until the direct path is
// verified, to keep the first slice simple).

import * as THREE from "three";
import type Editor from "../editor";
import type { ClipLane } from "../timeline/types";

// Per-lane runtime state. `action` is null while the clip GLB is still
// loading — or TERMINALLY, when the lane can't bind (see `boundRoot`).
interface LaneRuntime {
  laneId: string;
  characterUuid: string;
  sourceMediaId: string;
  startTime: number;
  loop: boolean;
  action: THREE.AnimationAction | null;
  // The clip's natural length (drives loop modulo / end clamping).
  clipDuration: number;
  // The strip's on-timeline length — the authoritative play window. Strips
  // default to a compact width, so this is usually shorter than the clip;
  // a non-loop strip longer than the clip freezes on the last frame.
  stripDuration: number;
  // The scene root this runtime was assessed against, or null when the
  // object didn't exist at add time. Every lane state is TERMINAL:
  // revalidate() reassesses a lane only when the live root INSTANCE for its
  // uuid differs from boundRoot (object appeared, vanished, or was replaced
  // under the same uuid) — never on a timer or per-refresh retry loop.
  boundRoot: THREE.Object3D | null;
}

// Captured local transform of one node, for rest-pose restoration.
interface RestTransform {
  node: THREE.Object3D;
  position: THREE.Vector3;
  quaternion: THREE.Quaternion;
  scale: THREE.Vector3;
}

export class CharacterAnimationManager {
  // characterUuid → mixer (root = the character Object3D).
  private mixers = new Map<string, THREE.AnimationMixer>();
  // laneId → runtime.
  private lanes = new Map<string, LaneRuntime>();
  // laneId → monotonic token, so a superseded async load can't clobber state.
  private loadTokens = new Map<string, number>();
  // characterUuid → rest pose of every node BELOW the root (the root itself
  // is excluded — its transform belongs to the user/gizmo/keyframes),
  // captured when the mixer is first created. Restored in gaps instead of
  // THREE.Skeleton.pose(): pose() rebuilds bone locals from inverse bind
  // matrices, which mis-scales rigs whose armature carries a baked scale
  // (mixamo cm-rigs) — that made characters visually vanish the moment a
  // strip moved off the playhead.
  private restPoses = new Map<string, RestTransform[]>();

  constructor(private readonly editor: Editor) {}

  // Reconcile the live runtime to `clipLanes`: dispose lanes that vanished,
  // load lanes that appeared. Idempotent — called on every timeline change.
  sync(clipLanes: ClipLane[]): void {
    const wanted = new Set(clipLanes.map((l) => l.id));
    for (const laneId of [...this.lanes.keys()]) {
      if (!wanted.has(laneId)) this.disposeLane(laneId);
    }
    for (const lane of clipLanes) {
      const rt = this.lanes.get(lane.id);
      if (!rt) {
        void this.addLane(lane);
      } else {
        // Placement and trim can change without a reload.
        rt.startTime = lane.strip.startTime;
        rt.loop = lane.strip.loop;
        rt.stripDuration = lane.strip.duration;
      }
    }
    this.pruneMixers();
  }

  // Pose every character at `playhead` (seconds). Deterministic: sets each
  // action's absolute time then applies via mixer.update(0).
  evaluateAt(playhead: number): void {
    // Characters that have a clip covering this playhead. Everyone else is
    // reset to their bind (T) pose below.
    const posed = new Set<string>();
    // Pick ONE winning lane per character first. Strip intervals are closed
    // at both ends so seek-to-end still holds a final pose, but strips are
    // deliberately snapped flush (resolveFreeStart), so at a shared boundary
    // — A ends exactly where B starts, and scrubs/records land on exact
    // frame times — both would qualify. Enabling both blends A's last frame
    // with B's first at half weight each, a garbage pose the deterministic
    // recorder would encode into video. The LATER strip (smaller local time)
    // wins the boundary.
    const winners = new Map<string, LaneRuntime>();
    for (const rt of this.lanes.values()) {
      const action = rt.action;
      if (!action) continue;
      const local = playhead - rt.startTime;
      if (local < 0 || local > rt.stripDuration) {
        action.enabled = false;
        continue;
      }
      const incumbent = winners.get(rt.characterUuid);
      if (!incumbent) {
        winners.set(rt.characterUuid, rt);
        continue;
      }
      if (local < playhead - incumbent.startTime) {
        incumbent.action!.enabled = false;
        winners.set(rt.characterUuid, rt);
      } else {
        action.enabled = false;
      }
    }
    for (const rt of winners.values()) {
      let local = playhead - rt.startTime;
      // The strip's on-timeline width is the play window; the clip's natural
      // length only drives the loop modulo / final-frame clamp inside it.
      const dur = rt.clipDuration;
      if (rt.loop && dur > 0) local = local % dur;
      else local = Math.min(local, dur);
      const action = rt.action!;
      action.enabled = true;
      action.paused = true; // we drive time ourselves; don't auto-advance
      action.time = local;
      action.setEffectiveWeight(1);
      posed.add(rt.characterUuid);
    }
    // Gaps between strips (and before the first / after the last) have no active
    // clip. A disabled action leaves the skeleton frozen on its last evaluated
    // frame, so explicitly restore the captured rest pose for those characters —
    // the "default state" when nothing is under the scrubber.
    for (const uuid of this.mixers.keys()) {
      if (!posed.has(uuid)) this.resetToRestPose(uuid);
    }
    for (const mixer of this.mixers.values()) mixer.update(0);
  }

  // Reassess lanes/mixers whose scene object CHANGED — appeared (undo
  // restoring a deleted character), vanished, or was replaced under the
  // same uuid (delete→undo, in-session scene reloads); mixers and rest
  // poses hold object-instance references, so a replaced root would
  // otherwise keep the runtime animating the detached old object forever.
  //
  // Called on every outliner refresh (the funnel all object-lifecycle
  // changes pass through) but deliberately LOOP-FREE: lane states are
  // terminal, and "changed" is one map lookup per lane/mixer against the
  // top-level roots — no traverses, no fetches, and sync() runs only when
  // something was actually purged. An idle refresh costs O(children+lanes).
  revalidate(): void {
    const timeline = this.editor.timelineController.getTimeline();
    if (!timeline) return;
    const roots = new Map<string, THREE.Object3D>();
    for (const child of this.editor.activeScene.scene.children) {
      roots.set(child.uuid, child);
    }
    let changed = false;
    for (const [uuid, mixer] of [...this.mixers]) {
      if (roots.get(uuid) !== mixer.getRoot()) {
        mixer.stopAllAction();
        this.mixers.delete(uuid);
        this.restPoses.delete(uuid);
        changed = true;
      }
    }
    for (const rt of [...this.lanes.values()]) {
      if ((roots.get(rt.characterUuid) ?? null) !== rt.boundRoot) {
        this.disposeLane(rt.laneId);
        changed = true;
      }
    }
    // sync() re-registers the purged lanes against the new reality; each
    // lands in a fresh terminal state (bound / missing / unbindable).
    // Re-posing happens in addLane's own tail evaluate.
    if (changed) this.sync(timeline.clipLanes);
  }

  clear(): void {
    for (const laneId of [...this.lanes.keys()]) this.disposeLane(laneId);
    for (const uuid of this.mixers.keys()) this.resetToRestPose(uuid);
    for (const mixer of this.mixers.values()) mixer.stopAllAction();
    this.mixers.clear();
    this.restPoses.clear();
  }

  // ─── internals ────────────────────────────────────────────────────────

  private async addLane(lane: ClipLane): Promise<void> {
    const token = (this.loadTokens.get(lane.id) ?? 0) + 1;
    this.loadTokens.set(lane.id, token);

    const rt: LaneRuntime = {
      laneId: lane.id,
      characterUuid: lane.objectUuid,
      sourceMediaId: lane.strip.sourceMediaId,
      startTime: lane.strip.startTime,
      loop: lane.strip.loop,
      action: null,
      clipDuration: lane.strip.duration,
      stripDuration: lane.strip.duration,
      boundRoot: null,
    };
    this.lanes.set(lane.id, rt);

    const character = this.findObject(lane.objectUuid);
    if (!character) {
      // Terminal "missing object" state (boundRoot stays null). The
      // registration is KEPT so sync() never re-attempts it; revalidate()
      // revives the lane exactly once, when a root for this uuid
      // (re)appears — e.g. undo restoring a deleted character.
      return;
    }
    rt.boundRoot = character;

    let clip: THREE.AnimationClip | undefined;
    if (lane.strip.bakedClipIndex !== undefined) {
      // Baked clip: sourced from the object's own `animations[]`, which is
      // never mutated (baked clips stay on the model and in the picker).
      // CLONED per lane: mixer.clipAction caches one action per (clip, root),
      // so handing two strips the same AnimationClip instance makes them
      // fight over a single action — whichever lane evaluates last wins,
      // freezing the other strip's window — and disposeLane's uncacheClip
      // would kill the surviving strip's action along with the removed one.
      // Clones share the underlying keyframe arrays, so this is cheap.
      // Resolves synchronously, so no load-token dance is needed.
      const source = character.animations?.[lane.strip.bakedClipIndex];
      if (!source) {
        console.warn(
          `Baked clip index ${lane.strip.bakedClipIndex} not found on object ${lane.objectUuid} (object has ${character.animations?.length ?? 0} baked clips).`,
        );
        return;
      }
      clip = source.clone();
    } else {
      // Skeletal clips need a rig to bind to, and a uuid-resolvable root is
      // always FULLY loaded (every load path stamps the target uuid only
      // after its GLB arrives — verified across create, scene-load and
      // undo-restore paths), so a rig-less subtree is a terminal verdict,
      // not a loading state: the lane stays registered as unbindable — one
      // warn, no fetch, no retry — until revalidate() sees the root
      // instance change.
      let hasRig = false;
      character.traverse((node) => {
        if (
          (node as THREE.Bone).isBone ||
          (node as THREE.SkinnedMesh).isSkinnedMesh
        ) {
          hasRig = true;
        }
      });
      if (!hasRig) {
        console.warn(
          `Animation clip lane targets object ${lane.objectUuid}, which has no rig (no bones/skinned mesh) — strip will not play.`,
        );
        return;
      }
      const glb = await this.editor.activeScene.loadRawGlb(
        lane.strip.sourceMediaId,
      );
      // Bail if this lane was removed/replaced while the clip was loading.
      if (this.loadTokens.get(lane.id) !== token || !this.lanes.has(lane.id)) {
        return;
      }
      clip = glb?.animations?.[0];
      if (!clip) {
        console.warn(
          "Animation clip has no animations track:",
          lane.strip.sourceMediaId,
        );
        return;
      }
    }

    const mixer = this.getMixer(lane.objectUuid, character);
    const action = mixer.clipAction(clip);
    action.play();
    action.paused = true;
    action.enabled = false;
    action.loop = rt.loop ? THREE.LoopRepeat : THREE.LoopOnce;
    action.clampWhenFinished = true;
    rt.action = action;
    rt.clipDuration = clip.duration;

    // Diagnostic for the direct-bind vs retarget question: if none of the
    // clip's tracks resolve to a node on the character, the character won't
    // move — that's the signal to wire SkeletonUtils.retargetClip. (A baked
    // clip trivially binds to its own model; the check is skipped.)
    if (
      lane.strip.bakedClipIndex === undefined &&
      !this.clipBindsToCharacter(clip, character)
    ) {
      console.warn(
        `Animation clip "${clip.name}" bound 0 tracks on character ${lane.objectUuid} — likely a rig/bone-name mismatch (retarget needed).`,
      );
    }

    // Adopt the clip's real length into the timeline data (fresh drops only;
    // user trims are preserved), so the strip width and move/trim clamps are
    // correct and survive save/reload.
    this.editor.timelineController.resolveClipDuration(lane.id, clip.duration);

    // Pose immediately at the current playhead so the drop is visible even
    // when the timeline isn't playing.
    this.evaluateAt(this.editor.timelineController.getPlayhead());
  }

  // NB: uncaching releases MIXER state only — for baked clips the underlying
  // AnimationClip stays untouched on the object's `animations[]` (baked clips
  // are never removed from the model, only unscheduled).
  private disposeLane(laneId: string): void {
    const rt = this.lanes.get(laneId);
    if (!rt) return;
    this.loadTokens.set(laneId, (this.loadTokens.get(laneId) ?? 0) + 1);
    if (rt.action) {
      const mixer = this.mixers.get(rt.characterUuid);
      rt.action.stop();
      mixer?.uncacheAction(rt.action.getClip());
      mixer?.uncacheClip(rt.action.getClip());
    }
    this.lanes.delete(laneId);
  }

  // Drop mixers whose character no longer has any lanes. The character is
  // restored to its rest pose first so removing the last strip doesn't
  // leave it frozen mid-animation.
  private pruneMixers(): void {
    const live = new Set([...this.lanes.values()].map((l) => l.characterUuid));
    for (const uuid of [...this.mixers.keys()]) {
      if (!live.has(uuid)) {
        this.resetToRestPose(uuid);
        this.mixers.get(uuid)?.stopAllAction();
        this.mixers.delete(uuid);
        this.restPoses.delete(uuid);
      }
    }
  }

  private getMixer(uuid: string, root: THREE.Object3D): THREE.AnimationMixer {
    let mixer = this.mixers.get(uuid);
    if (!mixer) {
      mixer = new THREE.AnimationMixer(root);
      this.mixers.set(uuid, mixer);
      this.restPoses.set(uuid, this.captureRestPose(root));
    }
    return mixer;
  }

  // Snapshot the local transforms of every node BELOW the root — the pose the
  // model is in when its first clip arrives (normally the load/T pose). The
  // root is excluded: its transform is owned by the gizmo/keyframe system and
  // must never snap back on a gap.
  private captureRestPose(root: THREE.Object3D): RestTransform[] {
    const rest: RestTransform[] = [];
    for (const child of root.children) {
      child.traverse((node) => {
        rest.push({
          node,
          position: node.position.clone(),
          quaternion: node.quaternion.clone(),
          scale: node.scale.clone(),
        });
      });
    }
    return rest;
  }

  // Restore a character to the pose captured at mixer creation — the
  // "default state" shown wherever no clip covers the playhead.
  private resetToRestPose(characterUuid: string): void {
    const rest = this.restPoses.get(characterUuid);
    if (!rest) return;
    for (const { node, position, quaternion, scale } of rest) {
      node.position.copy(position);
      node.quaternion.copy(quaternion);
      node.scale.copy(scale);
    }
  }

  // True if at least one of the clip's tracks names a node that exists under
  // `character`. Mixamo clips address bones as "mixamorig:Hips.position"; we
  // strip the ".property" suffix and look the node up by name.
  private clipBindsToCharacter(
    clip: THREE.AnimationClip,
    character: THREE.Object3D,
  ): boolean {
    return clip.tracks.some((track) => {
      const nodeName = track.name.split(".")[0];
      if (!nodeName) return false;
      return character.getObjectByName(nodeName) !== undefined;
    });
  }

  // Lane targets are always top-level scene roots (drops, clicks and baked
  // adds all attach to outliner-level objects) — no deep traverse needed.
  private findObject(uuid: string): THREE.Object3D | undefined {
    return this.editor.activeScene.scene.children.find(
      (child) => child.uuid === uuid,
    );
  }
}
