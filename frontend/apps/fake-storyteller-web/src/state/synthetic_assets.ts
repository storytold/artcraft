/**
 * Synthesized result assets.
 *
 * The repo ships image and video fixtures, but nothing for audio, mesh or
 * splat results. Rather than hand back a broken file and let the viewer fail in
 * a confusing way, these build small well-formed assets in the formats the
 * frontend actually loads.
 */

const SAMPLE_RATE_HZ = 44_100;
const TONE_SECONDS = 2;
const TONE_HZ = 440;
const TONE_AMPLITUDE = 0.12;

const SPLAT_POINT_COUNT = 512;

/** 16-bit mono PCM WAV holding a quiet tone, so waveform UIs render something. */
export function makeWavBytes(): Buffer {
  const sampleCount = SAMPLE_RATE_HZ * TONE_SECONDS;
  const dataBytes = sampleCount * 2;
  const buffer = Buffer.alloc(44 + dataBytes);

  buffer.write("RIFF", 0, "ascii");
  buffer.writeUInt32LE(36 + dataBytes, 4);
  buffer.write("WAVE", 8, "ascii");
  buffer.write("fmt ", 12, "ascii");
  buffer.writeUInt32LE(16, 16); // PCM header size
  buffer.writeUInt16LE(1, 20); // PCM
  buffer.writeUInt16LE(1, 22); // mono
  buffer.writeUInt32LE(SAMPLE_RATE_HZ, 24);
  buffer.writeUInt32LE(SAMPLE_RATE_HZ * 2, 28); // byte rate
  buffer.writeUInt16LE(2, 32); // block align
  buffer.writeUInt16LE(16, 34); // bits per sample
  buffer.write("data", 36, "ascii");
  buffer.writeUInt32LE(dataBytes, 40);

  for (let index = 0; index < sampleCount; index += 1) {
    const value = Math.sin((2 * Math.PI * TONE_HZ * index) / SAMPLE_RATE_HZ) * TONE_AMPLITUDE;
    buffer.writeInt16LE(Math.round(value * 32_767), 44 + index * 2);
  }

  return buffer;
}

/** A valid single-triangle GLB, enough for a 3D viewer to load and frame something. */
export function makeGlbBytes(): Buffer {
  const vertices = new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]);
  const binary = Buffer.from(vertices.buffer);

  const gltf = {
    asset: { version: "2.0", generator: "fake-storyteller-web" },
    scene: 0,
    scenes: [{ nodes: [0] }],
    nodes: [{ mesh: 0 }],
    meshes: [{ primitives: [{ attributes: { POSITION: 0 } }] }],
    accessors: [
      {
        bufferView: 0,
        componentType: 5126, // FLOAT
        count: 3,
        type: "VEC3",
        min: [0, 0, 0],
        max: [1, 1, 0],
      },
    ],
    bufferViews: [{ buffer: 0, byteOffset: 0, byteLength: binary.length }],
    buffers: [{ byteLength: binary.length }],
  };

  const jsonChunk = padChunk(Buffer.from(JSON.stringify(gltf), "utf8"), 0x20);
  const binaryChunk = padChunk(binary, 0x00);

  const header = Buffer.alloc(12);
  header.write("glTF", 0, "ascii");
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(12 + 8 + jsonChunk.length + 8 + binaryChunk.length, 8);

  return Buffer.concat([
    header,
    chunkHeader(jsonChunk.length, 0x4e4f_534a),
    jsonChunk,
    chunkHeader(binaryChunk.length, 0x004e_4942),
    binaryChunk,
  ]);
}

/**
 * A binary little-endian PLY in the 3D Gaussian Splatting layout, holding a
 * cloud of points in a small cube.
 */
export function makePlyBytes(): Buffer {
  const properties = [
    "x", "y", "z",
    "nx", "ny", "nz",
    "f_dc_0", "f_dc_1", "f_dc_2",
    "opacity",
    "scale_0", "scale_1", "scale_2",
    "rot_0", "rot_1", "rot_2", "rot_3",
  ];

  const header =
    "ply\n" +
    "format binary_little_endian 1.0\n" +
    `element vertex ${SPLAT_POINT_COUNT}\n` +
    properties.map((property) => `property float ${property}\n`).join("") +
    "end_header\n";

  const body = Buffer.alloc(SPLAT_POINT_COUNT * properties.length * 4);
  let offset = 0;
  const write = (value: number): void => {
    body.writeFloatLE(value, offset);
    offset += 4;
  };

  for (let index = 0; index < SPLAT_POINT_COUNT; index += 1) {
    const angle = (index / SPLAT_POINT_COUNT) * Math.PI * 2;
    const radius = 0.5 + 0.25 * Math.sin(index * 0.37);

    write(Math.cos(angle) * radius);
    write(Math.sin(index * 0.11) * 0.4);
    write(Math.sin(angle) * radius);

    write(0); write(1); write(0); // normals, unused by splat renderers

    write(0.6); write(0.4); write(0.9); // spherical-harmonic DC term (colour)
    write(4); // opacity, pre-sigmoid
    write(-4); write(-4); write(-4); // log-scale
    write(1); write(0); write(0); write(0); // rotation quaternion
  }

  return Buffer.concat([Buffer.from(header, "ascii"), body]);
}

function chunkHeader(length: number, type: number): Buffer {
  const header = Buffer.alloc(8);
  header.writeUInt32LE(length, 0);
  header.writeUInt32LE(type, 4);
  return header;
}

/** GLB chunks must be four-byte aligned; JSON pads with spaces, binary with zeroes. */
function padChunk(chunk: Buffer, padByte: number): Buffer {
  const remainder = chunk.length % 4;
  if (remainder === 0) {
    return chunk;
  }
  return Buffer.concat([chunk, Buffer.alloc(4 - remainder, padByte)]);
}
