import * as THREE from "three";
import { TextGeometry } from "three/addons/geometries/TextGeometry.js";
import { FontLoader } from "three/examples/jsm/loaders/FontLoader.js";
import { Font } from "three/examples/jsm/loaders/FontLoader.js";

export class LoadingPlaceHolder3DModel {
  public message_mesh: THREE.Mesh | undefined;

  constructor() {
    this.message_mesh = undefined;
  }

  public async destroyWithScene(scene: THREE.Scene) {
    if (this.message_mesh === undefined) {
      return;
    }
    scene.remove(this.message_mesh);
    this.message_mesh.geometry.dispose();
  }

  public async initialize(
    message: string,
    position: THREE.Vector3,
    font: Font,
  ): Promise<THREE.Mesh> {
    return (this.message_mesh = await this.createTextGeometry(
      message,
      position,
      font,
    ));
  }

  private async createTextGeometry(
    text: string,
    position: THREE.Vector3,
    font: Font,
  ): Promise<THREE.Mesh> {
    if (font) {
      const textGeometry = new TextGeometry(text, {
        font: font,
        size: 0.25,
        height: 0.1,
        curveSegments: 1,
        bevelEnabled: false,
        bevelThickness: 1,
        bevelSize: 1,
        bevelOffset: 1,
        bevelSegments: 5,
      });

      const textMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff });
      const message_mesh = new THREE.Mesh(textGeometry, textMaterial);
      message_mesh.position.set(position.x, position.y, position.z);
      return message_mesh;
    }
    throw Error(`Could not Create Text Geometry for ${text}`);
  }
}

export class LoadingPlaceHolderManager {
  private messages: Map<string, LoadingPlaceHolder3DModel>;
  private font: Font | undefined;
  private scene: THREE.Scene;

  constructor(scene: THREE.Scene) {
    this.messages = new Map<string, LoadingPlaceHolder3DModel>();
    this.font = undefined;
    this.scene = scene;
  }

  async initialize() {
    this.font = await this.loadFont();
  }

  public async remove(id: string) {
    const result = this.messages.get(id);
    if (result === undefined) {
      return;
    }
    result.destroyWithScene(this.scene);
    this.messages.delete(id);
  }

  public async add(id: string, message: string, position: THREE.Vector3) {
    const placeholder = new LoadingPlaceHolder3DModel();
    if (this.font === undefined) {
      console.log("Forgot to Initialize LoadingPlaceHolderManager");
      return;
    }
    const placeholder3DObj = await placeholder.initialize(
      message,
      position,
      this.font,
    );
    this.scene.add(placeholder3DObj);
    this.messages.set(id, placeholder);
  }

  // Load the font wrapper
  private async loadFont(): Promise<Font> {
    return new Promise<Font>((resolve, reject) => {
      const loader = new FontLoader();
      loader.load(
        "/resources/fonts/CarterOneRegular.json",
        (font) => {
          resolve(font);
        },
        (progress) => {
          console.log(`Font Loaded: ${progress.loaded / progress.total}`);
        },
        (error) => {
          reject(error);
        },
      );
    });
  }
}
