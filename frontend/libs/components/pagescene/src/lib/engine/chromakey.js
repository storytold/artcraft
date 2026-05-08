/**
 * THREE.JS ShaderMaterial that removes a specified color (e.g. greens screen)
 * from a texture. Shader code by https://github.com/Mugen87 on THREE.js forum:
 * https://discourse.threejs.org/t/production-ready-green-screen-with-three-js/23113/2
 */
// import {ColorRepresentation} from 'three/src/utils';

import { VERTEX_SHADER, FRAGMENT_SHADER } from "./shaders";
import * as THREE from "three";

// eslint-disable-next-line new-cap
class ChromaKeyMaterial extends THREE.ShaderMaterial {
  /**
   *
   * @param {HTMLVideoElement} videoElement Image or video to load into material's texture
   * @param {ColorRepresentation} keyColor
   * @param {number} width
   * @param {number} height
   * @param {number} similarity
   * @param {number} smoothness
   * @param {number} spill
   */
  constructor(
    VideoTexture,
    keyColor,
    width,
    height,
    similarity = 0.01,
    smoothness = 0.18,
    spill = 0.1,
  ) {
    super();

    this.texture = VideoTexture;

    const chromaKeyColor = new THREE.Color(keyColor);

    this.setValues({
      uniforms: {
        tex: {
          value: this.texture,
        },
        keyColor: { value: chromaKeyColor },
        texWidth: { value: width },
        texHeight: { value: height },
        similarity: { value: similarity },
        smoothness: { value: smoothness },
        spill: { value: spill },
      },
      vertexShader: VERTEX_SHADER,
      fragmentShader: FRAGMENT_SHADER,
      transparent: true,
    });
  }

  playVideo() {
    if (this.isVideo && this.video) {
      this.video.play();
    } else {
      throw new Error(`${this.url} is not a video file.`);
    }
  }

  pauseVideo() {
    if (this.isVideo && this.video) {
      this.video.pause();
    } else {
      throw new Error(`${this.url} is not a video file.`);
    }
  }
}

export { ChromaKeyMaterial };
