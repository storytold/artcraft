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

// Per-lane runtime state. `action` is null while the clip GLB is still loading.
interface LaneRuntime {
  laneId: string;
  characterUuid: string;
  sourceMediaId: string;
  startTime: number;
  loop: boolean;
  action: THREE.AnimationAction | null;
  clipDuration: number;
}

export class CharacterAnimationManager {
  // characterUuid → mixer (root = the character Object3D).
  private mixers = new Map<string, THREE.AnimationMixer>();
  // laneId → runtime.
  private lanes = new Map<string, LaneRuntime>();
  // laneId → monotonic token, so a superseded async load can't clobber state.
  private loadTokens = new Map<string, number>();
  // characterUuid → its skeleton(s), cached so bind-pose resets don't re-traverse.
  private skeletons = new Map<string, THREE.Skeleton[]>();

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
        // Placement can change without a reload.
        rt.startTime = lane.strip.startTime;
        rt.loop = lane.strip.loop;
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
    for (const rt of this.lanes.values()) {
      const action = rt.action;
      if (!action) continue;
      let local = playhead - rt.startTime;
      const dur = rt.clipDuration;
      const active = local >= 0 && (rt.loop || local <= dur);
      if (!active) {
        action.enabled = false;
        continue;
      }
      if (rt.loop && dur > 0) local = local % dur;
      else local = Math.min(local, dur);
      action.enabled = true;
      action.paused = true; // we drive time ourselves; don't auto-advance
      action.time = local;
      action.setEffectiveWeight(1);
      posed.add(rt.characterUuid);
    }
    // Gaps between strips (and before the first / after the last) have no active
    // clip. A disabled action leaves the skeleton frozen on its last evaluated
    // frame, so explicitly restore the bind pose for those characters — the
    // "default state" when nothing is under the scrubber.
    for (const uuid of this.mixers.keys()) {
      if (!posed.has(uuid)) this.resetToBindPose(uuid);
    }
    for (const mixer of this.mixers.values()) mixer.update(0);
  }

  clear(): void {
    for (const laneId of [...this.lanes.keys()]) this.disposeLane(laneId);
    for (const mixer of this.mixers.values()) mixer.stopAllAction();
    this.mixers.clear();
    this.skeletons.clear();
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
    };
    this.lanes.set(lane.id, rt);

    const character = this.findObject(lane.objectUuid);
    if (!character) return;

    const glb = await this.editor.activeScene.loadRawGlb(lane.strip.sourceMediaId);
    // Bail if this lane was removed/replaced while the clip was loading.
    if (this.loadTokens.get(lane.id) !== token || !this.lanes.has(lane.id)) {
      return;
    }
    const clip = glb?.animations?.[0];
    if (!clip) {
      console.warn(
        "Animation clip has no animations track:",
        lane.strip.sourceMediaId,
      );
      return;
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
    // move — that's the signal to wire SkeletonUtils.retargetClip.
    if (!this.clipBindsToCharacter(clip, character)) {
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

  // Drop mixers whose character no longer has any lanes.
  private pruneMixers(): void {
    const live = new Set([...this.lanes.values()].map((l) => l.characterUuid));
    for (const uuid of [...this.mixers.keys()]) {
      if (!live.has(uuid)) {
        this.mixers.get(uuid)?.stopAllAction();
        this.mixers.delete(uuid);
        this.skeletons.delete(uuid);
      }
    }
  }

  private getMixer(uuid: string, root: THREE.Object3D): THREE.AnimationMixer {
    let mixer = this.mixers.get(uuid);
    if (!mixer) {
      mixer = new THREE.AnimationMixer(root);
      this.mixers.set(uuid, mixer);
      this.skeletons.set(uuid, this.collectSkeletons(root));
    }
    return mixer;
  }

  // Reset a character's skeleton(s) to their bind (rest) pose. For Mixamo rigs
  // the bind pose is the T-pose — the "default state" shown wherever no clip
  // covers the playhead.
  private resetToBindPose(characterUuid: string): void {
    const skeletons = this.skeletons.get(characterUuid);
    if (!skeletons) return;
    for (const skeleton of skeletons) skeleton.pose();
  }

  private collectSkeletons(root: THREE.Object3D): THREE.Skeleton[] {
    const skeletons: THREE.Skeleton[] = [];
    root.traverse((o) => {
      const sm = o as THREE.SkinnedMesh;
      if (sm.isSkinnedMesh && sm.skeleton) skeletons.push(sm.skeleton);
    });
    return skeletons;
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

  private findObject(uuid: string): THREE.Object3D | undefined {
    return this.editor.activeScene.scene.getObjectByProperty("uuid", uuid);
  }
}
