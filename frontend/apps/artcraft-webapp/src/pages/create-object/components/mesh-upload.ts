import { MediaUploadApi, FilterEngineCategories } from "@storyteller/api";
import { UploaderStates } from "@storyteller/common";
import { uploadImage } from "../../../components/prompt-box/upload-image";
import type { RefImage } from "../../../components/prompt-box";

// Upload paths shared by the desktop reference deck (useMeshDeckRefs) and the
// mobile MeshInputsRow band.

export const MESH_FILE_ACCEPT = ".glb,.gltf,.fbx,.obj";

const randomId = () => Math.random().toString(36).substring(7);

const readAsDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

/** Uploads a multi-view angle image; resolves null on failure. */
export async function uploadViewImage(
  label: string,
  file: File,
): Promise<RefImage | null> {
  const url = await readAsDataUrl(file);
  return new Promise((resolve) => {
    uploadImage({
      title: `${label.toLowerCase()}-view-${Math.random().toString(36).substring(2, 10)}`,
      assetFile: file,
      progressCallback: (state) => {
        if (state.status === UploaderStates.success && state.data) {
          resolve({ id: randomId(), url, file, mediaToken: state.data });
        } else if (
          state.status === UploaderStates.assetError ||
          state.status === UploaderStates.imageCreateError
        ) {
          resolve(null);
        }
      },
    });
  });
}

/** Uploads a mesh file via the engine-asset endpoint; resolves null on failure. */
export async function uploadMeshFile(file: File): Promise<RefImage | null> {
  try {
    const api = new MediaUploadApi();
    const response = await api.UploadNewEngineAsset({
      file,
      fileName: file.name || `input-mesh-${Date.now()}`,
      uuid: crypto.randomUUID(),
      engine_category: FilterEngineCategories.OBJECT,
      maybe_title: "input_mesh",
    });
    if (response?.success && response.data) {
      return { id: randomId(), url: "", file, mediaToken: response.data };
    }
  } catch {
    // fall through — user can retry
  }
  return null;
}
