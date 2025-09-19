export declare enum FilterEngineCategories {
    ANIMATION = "animation",
    AUDIO = "audio",
    CHARACTER = "character",
    CREATURE = "creature",
    EXPRESSION = "expression",
    IMAGE_PLANE = "image_plane",
    LOCATION = "location",
    OBJECT = "object",
    SCENE = "scene",
    SET_DRESSING = "set_dressing",
    SKYBOX = "skybox",
    VIDEO_PLANE = "video_plane"
}
export declare enum UploaderStates {
    ready = 0,
    uploadingAsset = 1,
    uploadingImage = 2,
    uploadingCover = 3,
    settingCover = 4,
    success = 5,
    assetError = 6,
    coverCreateError = 7,
    coverSetError = 8,
    imageCreateError = 9
}
export interface UploaderState {
    status: UploaderStates;
    errorMessage?: string;
    data?: string;
}
export declare const initialUploaderState: {
    status: UploaderStates;
};
//# sourceMappingURL=Types.d.ts.map