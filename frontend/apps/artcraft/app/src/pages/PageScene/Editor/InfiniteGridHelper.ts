import * as THREE from "three";

export class InfiniteGridHelper extends THREE.Mesh {
  constructor(
    size1?: number,
    size2?: number,
    color?: THREE.Color,
    distance?: number,
    axes: string = "xzy",
  ) {
    color = color || new THREE.Color("white");
    size1 = size1 || 10;
    size2 = size2 || 100;
    distance = distance || 8000;

    const planeAxes = axes.substr(0, 2);
    const geometry = new THREE.PlaneGeometry(2, 2, 1, 1);

    const material = new THREE.ShaderMaterial({
      side: THREE.DoubleSide,
      uniforms: {
        uSize1: {
          value: size1,
        },
        uSize2: {
          value: size2,
        },
        uColor: {
          value: color,
        },
        uDistance: {
          value: distance,
        },
        uFadeStrength: {
          value: 1.5,
        },
        uFadeStart: {
          value: 0.2,
        },
      },
      transparent: true,
      vertexShader: `
                varying vec3 worldPosition;
                uniform float uDistance;
                
                void main() {
                    vec3 pos = position.${axes} * uDistance;
                    pos.${planeAxes} += cameraPosition.${planeAxes};
                    
                    worldPosition = pos;
                    
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
                }
            `,
      fragmentShader: `
                varying vec3 worldPosition;
                
                uniform float uSize1;
                uniform float uSize2;
                uniform vec3 uColor;
                uniform float uDistance;
                uniform float uFadeStrength;
                uniform float uFadeStart;
                
                float getGrid(float size) {
                    vec2 r = worldPosition.${planeAxes} / size;
                    vec2 grid = abs(fract(r - 0.5) - 0.5) / (fwidth(r) * 1.5);
                    float line = min(grid.x, grid.y);
                    return 1.0 - min(line, 1.0);
                }
                
                void main() {
                    float distFromCamera = length(cameraPosition.${planeAxes} - worldPosition.${planeAxes}) / uDistance;
                    float fadeOut = 1.0 - smoothstep(uFadeStart, 1.0, distFromCamera);
                    fadeOut = pow(fadeOut, uFadeStrength);
                    
                    float g1 = getGrid(uSize1);
                    float g2 = getGrid(uSize2);
                    
                    float grid = mix(g2 * 0.1, g1, g1);
                    
                    gl_FragColor = vec4(uColor.rgb, grid * fadeOut * 0.04);
                    gl_FragColor.a = mix(0.5 * gl_FragColor.a, gl_FragColor.a, g2);
                    
                    if (gl_FragColor.a <= 0.0) discard;
                }
            `,
      extensions: {
        derivatives: true,
      },
      blending: THREE.AdditiveBlending,
      depthTest: true,
      depthWrite: false,
    });

    super(geometry, material);
    this.frustumCulled = false;
  }
}
