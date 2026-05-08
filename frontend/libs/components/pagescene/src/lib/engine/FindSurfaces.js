import * as THREE from "three";

/*
  This class computes "surface IDs" for a given mesh.

  A "surface" is defined as a set of triangles that share vertices.
  
  Inspired by Ian MacLarty, see:
    https://twitter.com/ianmaclarty/status/1499494878908403712
*/
class FindSurfaces {
  constructor() {
    // This identifier, must be globally unique for each surface
    // across all geometry rendered on screen
    this.surfaceId = 0;
  }

  /*
   * Returns the surface Ids as a Float32Array that can be inserted as a vertex attribute
   */
  getSurfaceIdAttribute(mesh) {
    const bufferGeometry = mesh.geometry;
    const numVertices = bufferGeometry.attributes.position.count;
    const vertexIdToSurfaceId = this._generateSurfaceIds(mesh);

    const colors = [];
    for (let i = 0; i < numVertices; i++) {
      const vertexId = i;
      let surfaceId = vertexIdToSurfaceId[vertexId];

      colors.push(surfaceId, 0, 0, 1);
    }

    const colorsTypedArray = new Float32Array(colors);
    return colorsTypedArray;
  }

  /*
   * Returns a `vertexIdToSurfaceId` map
   * given a vertex, returns the surfaceId
   */
  _generateSurfaceIds(mesh) {
    const bufferGeometry = mesh.geometry;
    //const numVertices = bufferGeometry.attributes.position.count;
    const numIndices = bufferGeometry.index.count;
    const indexBuffer = bufferGeometry.index.array;
    //const vertexBuffer = bufferGeometry.attributes.position.array;
    // For each vertex, search all its neighbors
    const vertexMap = {};
    for (let i = 0; i < numIndices; i += 3) {
      const i1 = indexBuffer[i + 0];
      const i2 = indexBuffer[i + 1];
      const i3 = indexBuffer[i + 2];

      add(i1, i2);
      add(i1, i3);
      add(i2, i3);
    }
    function add(a, b) {
      if (vertexMap[a] == undefined) vertexMap[a] = [];
      if (vertexMap[b] == undefined) vertexMap[b] = [];

      if (vertexMap[a].indexOf(b) == -1) vertexMap[a].push(b);
      if (vertexMap[b].indexOf(a) == -1) vertexMap[b].push(a);
    }

    // Find cycles
    const frontierNodes = Object.keys(vertexMap).map((v) => Number(v));
    const exploredNodes = {};
    const vertexIdToSurfaceId = {};

    while (frontierNodes.length > 0) {
      const node = frontierNodes.pop();
      if (exploredNodes[node]) continue;

      // Get all neighbors recursively
      const surfaceVertices = getNeighborsNonRecursive(node);
      // Mark them as explored
      for (let v of surfaceVertices) {
        exploredNodes[v] = true;
        vertexIdToSurfaceId[v] = this.surfaceId;
      }

      this.surfaceId += 1;
    }

    // function getNeighbors(node, explored) {
    //   const neighbors = vertexMap[node];
    //   let result = [node];
    //   explored[node] = true;

    //   for (let n of neighbors) {
    //     if (explored[n]) continue;
    //     explored[n] = true;
    //     const newNeighbors = getNeighbors(n, explored);
    //     result = result.concat(newNeighbors);
    //   }

    //   return result;
    // }

    function getNeighborsNonRecursive(node) {
      const frontier = [node];
      const explored = {};
      const result = [];

      while (frontier.length > 0) {
        const currentNode = frontier.pop();
        if (explored[currentNode]) continue;
        const neighbors = vertexMap[currentNode];
        result.push(currentNode);

        explored[currentNode] = true;

        for (let n of neighbors) {
          if (!explored[n]) {
            frontier.push(n);
          }
        }
      }

      return result;
    }

    return vertexIdToSurfaceId;
  }
}

export default FindSurfaces;

export function getSurfaceIdMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: {
      maxSurfaceId: { value: 1 },
    },
    vertexShader: getVertexShader(),
    fragmentShader: getFragmentShader(),
    vertexColors: true,
  });
}

function getVertexShader() {
  return `
  varying vec2 v_uv;
  varying vec4 vColor;

  void main() {
     v_uv = uv;
     vColor = color;

     gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
  `;
}

function getFragmentShader() {
  return `
  varying vec2 v_uv;
  varying vec4 vColor;
  uniform float maxSurfaceId;

  void main() {
    // Normalize the surfaceId when writing to texture
    // Surface ID needs rounding as precision can be lost in perspective correct interpolation 
    // - see https://github.com/OmarShehata/webgl-outlines/issues/9 for other solutions eg. flat interpolation.
    float surfaceId = round(vColor.r) / maxSurfaceId;
    gl_FragColor = vec4(surfaceId, 0.0, 0.0, 1.0);
  }
  `;
}

// For debug rendering, assign a random color
// to each surfaceId
export function getDebugSurfaceIdMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: {},
    vertexShader: getVertexShader(),
    fragmentShader: `
  varying vec2 v_uv;
  varying vec4 vColor;

  void main() {      
      int surfaceId = int(round(vColor.r) * 100.0);
      float R = float(surfaceId % 255) / 255.0;
      float G = float((surfaceId + 50) % 255) / 255.0;
      float B = float((surfaceId * 20) % 255) / 255.0;

      gl_FragColor = vec4(R, G, B, 1.0);
  }
  `,
    vertexColors: true,
  });
}
