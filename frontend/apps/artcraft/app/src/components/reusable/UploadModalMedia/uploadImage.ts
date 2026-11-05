// uploadImage: re-exports the image upload function (named UploadImageMedia there) from @storyteller/api under
// the shorter name uploadImage. Used by pages/PageDraw/BaseImageSelector.tsx and pages/PageScene/useTauriPageSceneAdapter.tsx.
// It is a plain async function, not the React component of the same name in UploadImageMedia.tsx.

export { UploadImageMedia as uploadImage } from "@storyteller/api";
