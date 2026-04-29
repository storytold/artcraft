import { FilesetResolver } from "@mediapipe/tasks-vision";

declare interface WasmFileset {
  wasmLoaderPath: string;
  wasmBinaryPath: string;
  assetLoaderPath?: string;
  assetBinaryPath?: string;
}

/**
 * This class is meant to cache the first instantiation of WasmFileset.
 */
export class CachedFilesetResolver {
  private static instance: CachedFilesetResolver;
  private _filesetResolver : WasmFileset;

  /** Singleton constructor */
  public static async getInstance() : Promise<CachedFilesetResolver> {
    if (CachedFilesetResolver.instance !== undefined) {
      return CachedFilesetResolver.instance;
    }
    const resolver : WasmFileset = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm",
    );
    const instance = new CachedFilesetResolver(resolver);
    CachedFilesetResolver.instance = instance;
    return instance;
  }

  /** Accessor. */
  public get filesetResolver() {
    return this._filesetResolver;
  }

  private constructor(filesetResolver: WasmFileset) {
    this._filesetResolver = filesetResolver;
  }
}
