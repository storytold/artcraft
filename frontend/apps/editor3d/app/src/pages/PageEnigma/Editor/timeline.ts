import * as THREE from "three";

import { ClipUI } from "../clips/clip_ui";

import Scene from "./scene.js";
import AudioEngine from "./Engines/audio_engine";
import TransformEngine from "./Engines/transform_engine";
import LipSyncEngine from "./Engines/lip_sync_engine";

import Queue, {
  UnionedActionTypes,
  UnionedDataTypes,
} from "~/pages/PageEnigma/Queue/Queue";
import { QueueNames } from "../Queue/QueueNames";
import { toEngineActions } from "../Queue/toEngineActions";
import { fromEngineActions } from "../Queue/fromEngineActions";
import { ClipGroup, ClipType, AssetType } from "~/enums";
import { CameraAspectRatio, MediaFileType } from "~/pages/PageEnigma/enums";
import { Keyframe, MediaItem, UpdateTime } from "~/pages/PageEnigma/models";
import Editor from "~/pages/PageEnigma/Editor/editor";
import EmotionEngine from "./Engines/emotion_engine";
import { IGenerationOptions } from "~/pages/PageEnigma/models/generationOptions";
import { Vector3 } from "three";

import { filmLength, outlinerState } from "../signals";
import { CharacterAnimationEngine } from "./Engines/CharacterAnimationEngine";

export class TimeLine {
  editorEngine: Editor;
  timeline_items: ClipUI[];

  timeline_limit: number;
  absolute_end: number;
  scrubber_frame_position: number;
  is_playing: boolean;
  is_repeating: boolean = true;

  // plays audio
  audio_engine: AudioEngine;
  // key framing
  transform_engine: TransformEngine;
  // animation engine
  animation_engine: CharacterAnimationEngine;
  // lip sync engine
  lipSync_engine: LipSyncEngine;
  // emotion engine
  emotion_engine: EmotionEngine;

  // characters
  characters: { [key: string]: ClipGroup };

  scene: Scene;
  camera: THREE.Camera | null;
  mouse: THREE.Vector2 | undefined;

  current_time: number;

  camera_name: string;
  // ensure that the elements are loaded first.

  private debounce_generate_video: boolean;

  constructor(
    editor: Editor,
    audio_engine: AudioEngine,
    transform_engine: TransformEngine,
    lipsync_engine: LipSyncEngine,
    animation_engine: CharacterAnimationEngine,
    emotion_engine: EmotionEngine,
    scene: Scene,
    camera: THREE.Camera | null,
    mouse: THREE.Vector2 | undefined,
    camera_name: string,
  ) {
    this.editorEngine = editor;
    this.timeline_items = [];
    this.characters = {};
    this.absolute_end = 60 * 12;
    this.timeline_limit = this.getTimelineEnd();
    this.camera = camera;
    this.mouse = mouse;

    this.is_playing = false;
    this.scrubber_frame_position = 0; // in frames into the tl

    // this will be used to play the audio clips
    this.audio_engine = audio_engine;
    this.transform_engine = transform_engine;
    this.lipSync_engine = lipsync_engine;
    this.animation_engine = animation_engine;
    this.emotion_engine = emotion_engine;

    this.scene = scene;
    this.debounce_generate_video = false;
    Queue.subscribe(
      QueueNames.TO_ENGINE,
      "engine",
      this.handleTimelineActions.bind(this),
    );

    this.current_time = 0;
    this.camera_name = camera_name;
  }

  public async updateUI() {
    Queue.publish({
      queueName: QueueNames.FROM_ENGINE,
      action: fromEngineActions.UPDATE_TIME_LINE,
      data: this.timeline_items,
    });
  }

  public async pushEvent(action: fromEngineActions, data: UnionedDataTypes) {
    //this.current_time += 0.75;
    Queue.publish({
      queueName: QueueNames.FROM_ENGINE,
      action: fromEngineActions.UPDATE_TIME,
      data: data,
    });
  }

  public isCharacter(uuid: string): boolean {
    this.timeline_items.forEach((clip) => {
      if (clip.group == ClipGroup.CHARACTER)
        this.characters[clip.object_uuid] = ClipGroup.CHARACTER;
    });

    let result: boolean = false;
    for (const key in this.characters) {
      if (key === uuid) {
        result = true;
        return true;
      }
    }
    return result;
  }

  public async handleTimelineActions(data: {
    action: UnionedActionTypes;
    data: UnionedDataTypes;
  }) {
    const action = data.action;
    switch (action) {
      case toEngineActions.ADD_KEYFRAME:
        await this.addKeyFrame(data.data as Keyframe);
        break;
      case toEngineActions.UPDATE_KEYFRAME:
        await this.updateKeyFrame(data.data as Keyframe);
        break;
      case toEngineActions.DELETE_KEYFRAME:
        await this.deleteKeyFrame(data.data as Keyframe);
        break;
      case toEngineActions.ADD_CLIP:
        await this.addClip(data.data as ClipUI);
        break;
      case toEngineActions.DELETE_CLIP:
        await this.deleteClip(data.data as ClipUI);
        break;
      case toEngineActions.UPDATE_CLIP:
        await this.updateClip(data.data as ClipUI);
        break;
      case toEngineActions.UPDATE_TIME:
        await this.scrub(data.data as UpdateTime);
        break;
      case toEngineActions.MUTE:
        await this.mute(data.data as ClipUI, false);
        break;
      case toEngineActions.UNMUTE:
        await this.mute(data.data as ClipUI, true);
        break;
      // Create operations
      case toEngineActions.ADD_CHARACTER: {
        const newObject = await this.addCharacter(data.data as MediaItem);
        if (newObject)
          this.queueNewObjectMessage(
            newObject,
            data.data as MediaItem,
            AssetType.CHARACTER,
          );
        const result = this.editorEngine.sceneManager?.render_outliner(
          this.characters,
        );
        if (result) outlinerState.items.value = result.items;
        break;
      }
      case toEngineActions.ADD_OBJECT: {
        const newObject = await this.addObject(data.data as MediaItem);
        if (newObject)
          this.queueNewObjectMessage(
            newObject,
            data.data as MediaItem,
            AssetType.OBJECT,
          );
        const result = this.editorEngine.sceneManager?.render_outliner(
          this.characters,
        );
        if (result) outlinerState.items.value = result.items;
        break;
      }
      case toEngineActions.ADD_SHAPE: {
        const newShape = await this.addShape(data.data as MediaItem);
        this.queueNewObjectMessage(
          newShape,
          data.data as MediaItem,
          AssetType.SHAPE,
        );
        const result = this.editorEngine.sceneManager?.render_outliner(
          this.characters,
        );
        if (result) outlinerState.items.value = result.items;
        break;
      }
      case toEngineActions.ENTER_PREVIEW_STATE:
        await this.editorEngine.switchPreview();
        break;
      case toEngineActions.ENTER_EDIT_STATE:
        this.editorEngine.switchEdit();
        break;
      case toEngineActions.TOGGLE_CAMERA_STATE:
        this.editorEngine.switchCameraView();
        break;
      case toEngineActions.TOGGLE_REPEATING:
        this.is_repeating = !this.is_repeating;
        break;
      case toEngineActions.REFRESH_PREVIEW:
        if (this.editorEngine.switchPreviewToggle) {
          await this.editorEngine.generateFrame();
        }
        break;
      case toEngineActions.GENERATE_VIDEO: {
        console.log("Calling Generate Video");
        // debounce generate video ...
        if (this.debounce_generate_video == false) {
          this.debounce_generate_video = true;
          const options = data.data; // super overloaded talk to the devs about this. TODO... refactor
          // pass this in ... rather than doing it implicitly ...
          this.editorEngine.generation_options = options as IGenerationOptions;

          await this.editorEngine.generateVideo();
          this.debounce_generate_video = false;
        }
        console.log("Generate Video Press Event");
        break;
      }
      case toEngineActions.CHANGE_CAMERA_ASPECT_RATIO: {
        this.editorEngine.changeRenderCameraAspectRatio(
          data.data as CameraAspectRatio,
        );
        break;
      }
      default:
        console.log("Action Not Wired", action);
    }
  }

  public async addCharacter(data: MediaItem) {
    const media_id = data.media_id;
    const name = data.name;
    const pos = this.getPos();
    const new_data = { ...data };

    console.debug('Adding to engine scene manager: ', media_id, name, pos);

    const obj = await this.editorEngine.sceneManager?.create(
      media_id,
      name,
      pos,
    );

    if (obj) {
      obj.userData["name"] = name;
      obj.name = name;
      obj.position.copy(pos);
      obj.userData.isCharacter = true;

      console.debug("Added character object to timeline; object: ", obj);

      // TODO(bt,2025-01-28): Hack for debugging only. Remove soon.
      (window as any).lastCharacter = obj;

      // TODO(bt,2025-01-28): Hack for debugging only. Remove soon.
      const lastRig = obj.children[0];
      if (!!lastRig && lastRig.name.includes("gamerig")) {
        (window as any).lastRig = lastRig;
      }

      const object_uuid = obj.uuid;

      this.characters[object_uuid] = ClipGroup.CHARACTER; // TODO: Create a class to make the idea of a character.
      new_data["object_uuid"] = object_uuid;

      Queue.publish({
        queueName: QueueNames.FROM_ENGINE,
        action: fromEngineActions.UPDATE_CHARACTER_ID,
        data: new_data,
      });

      this.addPlayableClip(
        new ClipUI(
          data.version,
          ClipType.FAKE,
          ClipGroup.CHARACTER,
          "Default",
          media_id,
          obj.uuid,
          obj.uuid,
          name,
          0,
          0,
          0,
          obj.userData["media_file_type"],
        ),
      );

      await this.editorEngine.sceneManager?.add_creation_undostack(obj);
    }
    return obj;
  }

  queueNewObjectMessage(
    item: THREE.Object3D<THREE.Object3DEventMap>,
    data: MediaItem,
    asset_type: AssetType.OBJECT | AssetType.CHARACTER | AssetType.SHAPE,
  ) {
    Queue.publish({
      queueName: QueueNames.FROM_ENGINE,
      action: fromEngineActions.ADD_OBJECT,
      data: {
        media_id: data.media_id,
        type: asset_type,
        name: item.name,
        object_uuid: item.uuid,
        version: 1,
      } as MediaItem,
    });

    // this.addPlayableClip(
    //   new ClipUI(
    //     data["version"],
    //     ClipType.FAKE,
    //     ClipGroup.OBJECT,
    //     "Default",
    //     data.media_id,
    //     item.uuid,
    //     item.uuid,
    //     item.name,
    //     0,
    //     0,
    //     0,
    //     this.scene.get_object_by_uuid(item.uuid)?.userData[
    //       "media_file_type"
    //     ],
    //   ),
    // );
  }

  public getPos() {
    this.editorEngine.utils.removeTransformControls(true);
    const raycaster = new THREE.Raycaster();
    raycaster.layers.enable(0);
    raycaster.layers.enable(1);
    if (this.editorEngine.mouse && this.camera) {
      raycaster.setFromCamera(this.editorEngine.mouse, this.camera);
      const intersects = raycaster.intersectObjects(
        this.scene.scene.children,
        true,
      );
      if (intersects.length > 0) {
        return intersects[0].point;
      }
    }
    return new THREE.Vector3(0, 0, 0);
  }

  public async addObject(data: MediaItem & { position?: { x: number; y: number; z: number } }) {
    const dataPos = data.position;
    const pos = dataPos
      ? new THREE.Vector3(dataPos.x, dataPos.y, dataPos.z)
      : this.getPos();
    const media_id = data.media_id;
    const name = data.name;

    const obj = await this.editorEngine.sceneManager?.create(
      media_id,
      name,
      pos,
    );
    if (obj) {
      obj.userData["name"] = name;
      obj.name = name;
      obj.position.copy(pos);

      await this.editorEngine.sceneManager?.add_creation_undostack(obj);
    }
    return obj;
  }

  public async addShape(data: MediaItem) {
    const pos = this.getPos();
    const parim = await this.editorEngine.create_parim(data.media_id, pos);
    await this.editorEngine.sceneManager?.add_creation_undostack(parim);
    return parim;
  }

  public async addKeyFrame(data: Keyframe) {
    // KeyFrame Object
    // version: number;
    // clip_uuid: string;
    // group: ClipGroup;
    // object_uuid?: string;
    // offset: number;
    // position: XYZ
    // rotation: XYZ;
    // scale: XYZ;
    // selected?: boolean;
    const data_json = data;
    const uuid = data_json.object_uuid;
    const keyframe_uuid = data_json.keyframe_uuid;

    let object_name = this.scene.get_object_by_uuid(uuid)?.name;
    if (object_name === undefined) {
      object_name = "undefined";
    }

    this.transform_engine.addFrame(
      uuid,
      data_json.offset,
      data_json.position as Vector3,
      data_json.rotation as Vector3,
      data_json.scale as Vector3,
      data_json.offset,
      data_json.keyframe_uuid,
    );

    await this.addPlayableClip(
      new ClipUI(
        data_json["version"],
        ClipType.TRANSFORM,
        data_json["group"],
        object_name,
        "",
        keyframe_uuid,
        uuid,
        object_name,
        0,
        data_json["offset"],
        data_json["offset"],
        MediaFileType.None,
      ),
    );

    const point = this.scene.createPoint(
      data_json.position as Vector3,
      data_json.rotation as Vector3,
      data_json.scale as Vector3,
      data_json.keyframe_uuid,
    );
    if (this.editorEngine.camera_person_mode) {
      point.visible = false;
    }
    this.checkEditorCanPlay();
  }

  public checkEditorCanPlay() {
    this.editorEngine.can_playback = this.getLastClipEnd() > 1;
    this.editorEngine.updateSelectedUI();
  }

  // This method is NOT responsible for deletion of the object from scene or other editor parts
  // It is only responsible for deleting the object from the timeline and its corresponding elements
  public deleteObject(object: THREE.Object3D<THREE.Object3DEventMap>) {
    if (!object) {
      return
    }

    if (object.name === this.camera_name) {
      return;
    }

    const object_uuid = object.uuid;

    this.timeline_items.forEach((element) => {
      if (
        element.type == ClipType.TRANSFORM &&
        element.object_uuid == object_uuid
      ) {
        this.scene.deletePoint(element.clip_uuid);
      }
    });

    // TODO: In the future object should have relations that can be deleted inside the engines
    // and the engines handle the deletion of objects.
    // Character Animation Engine already does this.
    this.timeline_items = this.timeline_items.filter(
      (element) => element.object_uuid !== object_uuid,
    );

    this.animation_engine.removeCharacter(object);

    // Update react land here.
  }

  public async addClip(data: ClipUI) {
    const object_uuid = data.object_uuid;
    const media_id = data.media_id;
    const name = data.name;
    const group = data.group;
    const version = 1;
    const type = data.type;
    const offset = data.offset;
    const end_offset = data.length + offset;
    const object = this.scene.get_object_by_uuid(object_uuid);
    const object_name =
      object?.name ?? "undefined";
    const clip_uuid = data.clip_uuid;

    switch (type) {
      case "animation":
        await this.animation_engine.addCharacterAnimationMedia(object!, media_id, data);
        this.animation_engine.evaluate(this.current_time, this.timeline_limit);
        break;
      case "transform":
        this.transform_engine.loadObject(object_uuid, data.length);
        break;
      case "expression":
        this.emotion_engine.loadClip(object_uuid, media_id);
        break;
      case "audio":
        if (group === "character") {
          this.lipSync_engine.load_object(object_uuid, media_id);
          // media id for this as well it can be downloaded
          this.addPlayableClip(
            new ClipUI(
              version,
              ClipType.AUDIO,
              ClipGroup.CHARACTER,
              name,
              media_id,
              clip_uuid,
              object_uuid,
              object_name,
              offset,
              end_offset,
              0, // length
              this.scene.get_object_by_uuid(object_uuid)?.userData[
              "media_file_type"
              ],
            ),
          );
          return;
        } else {
          this.audio_engine.loadClip(media_id);
        }
        break;
    }

    // media id for this as well it can be downloaded
    this.addPlayableClip(
      new ClipUI(
        version,
        type,
        group,
        name,
        media_id,
        clip_uuid,
        object_uuid,
        object_name,
        offset,
        end_offset, // length
        0,
        this.scene.get_object_by_uuid(object_uuid)?.userData["media_file_type"],
      ),
    );

    this.checkEditorCanPlay();
  }

  public async addSelfAnimationClip(
    data: ClipUI,
    animation_clip: THREE.AnimationClip,
  ) {
    const object_uuid = data.object_uuid;
    const media_id = data.media_id;
    const name = data.name;
    const group = data.group;
    const version = 1;
    const type = data.type;
    const offset = data.offset;
    const end_offset = data.length + offset;
    const object = this.scene.get_object_by_uuid(object_uuid);
    const object_name =
      object?.name ?? "undefined";
    const clip_uuid = data.clip_uuid;

    this.animation_engine.addCharacterAnimation(object!, animation_clip, data);

    // media id for this as well it can be downloaded
    this.addPlayableClip(
      new ClipUI(
        version,
        type,
        group,
        name,
        media_id,
        clip_uuid,
        object_uuid,
        object_name,
        offset,
        end_offset, // length
        0,
        this.scene.get_object_by_uuid(object_uuid)?.userData["media_file_type"],
      ),
    );

    this.checkEditorCanPlay();
    this.updateUI();
  }

  public async deleteKeyFrame(data: Keyframe) {
    const keyframe_uuid = data.keyframe_uuid;
    const object_uuid = data.object_uuid;
    this.transform_engine.clips[object_uuid].removeKeyframe(keyframe_uuid);
    this.scene.deletePoint(keyframe_uuid);
    for (const element of this.timeline_items) {
      if (
        element.clip_uuid === keyframe_uuid &&
        element.object_uuid === object_uuid
      ) {
        this.timeline_items = this.timeline_items.filter(
          (element) =>
            !(
              element.clip_uuid === keyframe_uuid &&
              element.object_uuid === object_uuid
            ),
        );
        break;
      }
    }
    this.checkEditorCanPlay();
  }

  public async updateKeyFrame(data: Keyframe) {
    const keyframe_uuid = data.keyframe_uuid;
    const keyframe_offset = data.offset;
    const object_uuid = data.object_uuid;

    const keyframe_pos = data.position;
    const keyframe_rot = data.rotation;
    const keyframe_scl = data.scale;

    this.transform_engine.clips[object_uuid].setOffset(
      keyframe_uuid,
      keyframe_offset,
    );
    this.transform_engine.clips[object_uuid].setTransform(
      keyframe_uuid,
      keyframe_pos as Vector3,
      keyframe_rot as Vector3,
      keyframe_scl as Vector3,
    );
    this.scene.updatePoint(
      keyframe_uuid,
      keyframe_pos as Vector3,
      keyframe_rot as Vector3,
    );
    this.checkEditorCanPlay();
  }

  public async updateClip(data: ClipUI) {
    // only length and offset changes here.
    const object_uuid = data.object_uuid;
    const media_id = data.media_id;
    const offset = data.offset;
    const length = data.length + offset;
    const clip_uuid = data.clip_uuid;

    for (const element of this.timeline_items) {
      if (
        element.media_id === media_id &&
        element.object_uuid === object_uuid &&
        element.clip_uuid == clip_uuid
      ) {
        element.length = length;
        element.offset = offset;
      }
    }
    this.checkEditorCanPlay();
  }

  public async deleteClip(data: ClipUI) {
    const object_uuid = data.object_uuid;
    const media_id = data.media_id;
    const clip_uuid = data.clip_uuid;

    // Remove the clip from the items array
    for (let i = 0; i < this.timeline_items.length; i++) {
      const element = this.timeline_items[i];
      if (
        element.media_id === media_id &&
        element.object_uuid === object_uuid &&
        element.clip_uuid == clip_uuid
      ) {
        this.timeline_items.splice(i, 1);
        break;
      }
    }

    // Once the clip is removed, we need to make sure the engines aren't tracking it either
    // TODO: Ideally the engines should just handle this individually and we check them based on clip type/group
    // This way we won't need to iterate over all timeline items
    if (data.type === ClipType.ANIMATION) {
      const object = this.scene.get_object_by_uuid(object_uuid)!;
      this.animation_engine.removeAnimation(object, data)
    }

    this.checkEditorCanPlay();
  }

  public async mute(data: ClipUI, isMute: boolean) {
    this.timeline_items.forEach((element) => {
      if (element.group === data.group) {
        element.should_play = isMute;
      }
    });
  }

  public async addPlayableClip(clip: ClipUI): Promise<void> {
    this.timeline_items.push(clip);
  }

  public async scrub(data: UpdateTime): Promise<void> {
    if (this.is_playing) {
      return;
    }
    const value = Math.floor(data.currentTime);
    await this.setScrubberPosition(value);
    this.current_time = value;
    await this.update();

    if (this.editorEngine.switchPreviewToggle) {
      await this.editorEngine.generateFrame();
    }
  }

  // public streaming events into the timeline from
  public async setScrubberPosition(offset: number) {
    this.scrubber_frame_position = offset; // in ms
  }

  // should play from the clip that is closest to the to scrubber
  public async play(): Promise<void> {
    console.log(`Play - Starting Timeline`);
    this.is_playing = true;
  }

  public async resetScene() {
    for (const element of this.timeline_items) {
      if (element.type === ClipType.TRANSFORM) {
        const object = this.scene.get_object_by_uuid(element.object_uuid);
        if (object && this.transform_engine.clips[element.object_uuid]) {
          this.transform_engine.clips[element.object_uuid].reset(object);
        }
      } else if (
        element.type === ClipType.AUDIO &&
        element.group !== ClipGroup.CHARACTER
      ) {
        this.audio_engine.loadClip(element.media_id);
        this.audio_engine.stopClip(element.media_id);
      } else if (element.type === ClipType.ANIMATION) {
        this.animation_engine.stop();
      } else if (
        element.type === ClipType.AUDIO &&
        element.group === ClipGroup.CHARACTER
      ) {
        this.lipSync_engine.clips[
          element.object_uuid + element.media_id
        ].stop();
        this.lipSync_engine.clips[
          element.object_uuid + element.media_id
        ].reset();
      } else if (element.type === ClipType.EXPRESSION) {
        const object = this.scene.get_object_by_uuid(element.object_uuid);
        if (object)
          this.emotion_engine.clips[
            element.object_uuid + element.media_id
          ].reset(object);
      }
    }
  }

  public getLastClipEnd(): number {
    let longest = 0;
    for (const element of this.timeline_items) {
      if (longest < element.length) {
        longest = element.length;
      }
    }
    return longest;
  }

  public getTimelineEnd(): number {
    return filmLength.peek() * 1000;
  }

  // called by the editor update loop on each frame
  public async update(
    isRendering = false,
    delta_time: number = 0,
  ): Promise<boolean> {
    //if (this.is_playing === false) return; // start and stop
    this.timeline_limit = this.getTimelineEnd();
    if (this.is_playing) {
      this.current_time += delta_time * 1000;
      this.pushEvent(fromEngineActions.UPDATE_TIME, {
        currentTime: this.current_time,
      });
      this.scrubber_frame_position = this.current_time;
    }

    if (this.scrubber_frame_position <= 0) {
      for (const video_plane of this.scene.video_planes) {
        video_plane.currentTime = 0;
      }
      await this.resetScene();
    }

    for (const video_plane of this.scene.video_planes) {
      // Caps to 10fps so that the buffering issue is solved and it plays i am not sure how to fix this.
      // TODO: Fix buffering and make 30 fps.
      const fixedPoint = 1;

      let pb = parseFloat(
        (this.scrubber_frame_position / this.editorEngine.cap_fps).toFixed(
          fixedPoint,
        ),
      );
      pb = parseFloat((pb % video_plane.duration).toFixed(fixedPoint));
      if (video_plane.currentTime !== pb) {
        video_plane.playbackRate = 6;
        video_plane.currentTime = pb;
      }
    }

    //this.scrubber_frame_position += 1;
    //2. allow stopping.
    //3. smallest unit is a frame and it is set by the scene and is in fps, our videos will be 60fps but we can reprocess them using the pipeline.

    // Since the animation engine is newer we can just call an evaluation on it instead of having the timeline process it
    this.animation_engine.evaluate(this.current_time, this.timeline_limit);

    // Iterate over the clips and play them as fit
    for (const element of this.timeline_items) {
      if (
        element.offset <= this.scrubber_frame_position &&
        this.scrubber_frame_position <= element.length &&
        element.should_play
      ) {
        // run async
        // element.play()
        // remove the element from the list
        const object = this.scene.get_object_by_uuid(element.object_uuid);
        if (element.type === ClipType.TRANSFORM) {
          if (object && this.transform_engine.clips[element.object_uuid]) {
            this.transform_engine.clips[element.object_uuid].step(
              object,
              element.offset,
              this.scrubber_frame_position,
              this.scene,
            );
            element.length =
              this.transform_engine.clips[element.object_uuid].length;
          }
        } else if (
          element.type === ClipType.AUDIO &&
          element.group !== ClipGroup.CHARACTER &&
          this.is_playing &&
          !isRendering
        ) {
          // if (this.scrubber_frame_position + 1 >= element.length) {
          //   this.audio_engine.playClip(element.media_id);
          // } else {
          //   await this.audio_engine.step(
          //     element.object_uuid + element.media_id,
          //   this.scrubber_frame_position, element.offset);
          // }
          this.audio_engine.playClip(element.media_id);
          await this.audio_engine.step(
            element.media_id,
            this.scrubber_frame_position,
            element.offset,
          );
        } else if (
          element.type === ClipType.AUDIO &&
          element.group === ClipGroup.CHARACTER &&
          this.is_playing
        ) {
          if (object) {
            await this.lipSync_engine.clips[
              element.object_uuid + element.media_id
            ].play(object);
            this.lipSync_engine.clips[
              element.object_uuid + element.media_id
            ].step(this.scrubber_frame_position, element.offset);
          }
        } else if (element.type === ClipType.EXPRESSION) {
          if (object) {
            await this.emotion_engine.clips[
              object.uuid + element.media_id
            ].step(this.scrubber_frame_position - element.offset, object);
          }
        }
      }
    }

    if (
      this.scrubber_frame_position >= this.timeline_limit &&
      this.is_playing
    ) {
      await this.stop();
      return true;
    }

    return false;
  }

  private async stop(): Promise<void> {
    await this.resetScene();
    this.is_playing = false;
    console.log(`Stop - Stopping Timeline`);
    this.current_time = 0;
    this.update();
    this.pushEvent(fromEngineActions.UPDATE_TIME, {
      currentTime: this.current_time,
    });
  }
}
